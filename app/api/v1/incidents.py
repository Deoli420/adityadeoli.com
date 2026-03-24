import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, RequireWrite, TenantId
from app.db.session import get_session
from app.repositories.incident import IncidentRepository
from app.schemas.incident import (
    IncidentCreate,
    IncidentEventRead,
    IncidentListItem,
    IncidentNoteCreate,
    IncidentRead,
    IncidentStatusUpdate,
)
from app.services.incident import IncidentService

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _get_service(session: AsyncSession = Depends(get_session)) -> IncidentService:
    return IncidentService(repo=IncidentRepository(session))


@router.get("/", response_model=list[IncidentListItem])
async def list_incidents(
    user: CurrentUser,
    tenant_id: TenantId,
    status: Optional[str] = Query(default=None, pattern="^(OPEN|INVESTIGATING|RESOLVED)$"),
    limit: int = Query(default=50, ge=1, le=200),
    service: IncidentService = Depends(_get_service),
):
    return await service.list_incidents(
        tenant_id, status_filter=status, limit=limit
    )


@router.get("/{incident_id}", response_model=IncidentRead)
async def get_incident(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.get_incident(incident_id, tenant_id)


@router.get("/{incident_id}/timeline", response_model=list[IncidentEventRead])
async def get_timeline(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.get_timeline(incident_id, tenant_id)


@router.get("/endpoint/{endpoint_id}", response_model=list[IncidentRead])
async def list_by_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=20, ge=1, le=100),
    service: IncidentService = Depends(_get_service),
):
    return await service.list_by_endpoint(endpoint_id, tenant_id, limit=limit)


@router.post("/", response_model=IncidentRead, status_code=201, dependencies=[RequireWrite])
async def create_incident(
    data: IncidentCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.create_incident(data, tenant_id)


@router.patch("/{incident_id}/status", response_model=IncidentRead, dependencies=[RequireWrite])
async def update_status(
    incident_id: uuid.UUID,
    data: IncidentStatusUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    service: IncidentService = Depends(_get_service),
):
    from app.repositories.fingerprint import FingerprintRepository

    fp_repo = FingerprintRepository(session)
    return await service.update_status(incident_id, data, tenant_id, fp_repo=fp_repo)


@router.get("/{incident_id}/similar")
async def get_similar_incidents(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    service: IncidentService = Depends(_get_service),
):
    """Find similar incidents by fingerprint — exact, fuzzy, and cross-endpoint matches."""
    from app.repositories.fingerprint import FingerprintRepository
    from app.services.fingerprint import FingerprintService

    incident = await service.get_incident(incident_id, tenant_id)

    if not incident.fingerprint:
        return {
            "fingerprint": None,
            "signal_flags": [],
            "exact_match": None,
            "fuzzy_matches": [],
            "cross_endpoint_matches": [],
        }

    fp_repo = FingerprintRepository(session)
    fp_svc = FingerprintService()

    # Retrieve signal flags from the cache entry
    cache_entry = await fp_repo.get_cache_entry(incident.fingerprint, incident.endpoint_id)
    signal_flags = cache_entry.signal_flags if cache_entry else []

    matches = await fp_svc.find_matches(
        repo=fp_repo,
        fingerprint=incident.fingerprint,
        signal_flags=signal_flags,
        endpoint_id=incident.endpoint_id,
        org_id=incident.organization_id,
    )

    return {
        "fingerprint": incident.fingerprint,
        "signal_flags": signal_flags,
        "exact_match": matches.exact_match,
        "fuzzy_matches": matches.fuzzy_matches,
        "cross_endpoint_matches": matches.cross_endpoint_matches,
    }


@router.post("/{incident_id}/generate-narrative", dependencies=[RequireWrite])
async def generate_narrative(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Regenerate narrative for an incident on demand."""
    from app.ai.llm_client import llm_client
    from app.repositories.fingerprint import FingerprintRepository
    from app.services.fingerprint import FingerprintService
    from app.services.narrative import NarrativeService

    repo = IncidentRepository(session)
    svc = IncidentService(repo)
    incident = await svc.get_incident(incident_id, tenant_id)

    # Get fingerprint match data
    match_data = {"occurrence_count": 1, "avg_resolution_ms": None, "last_resolution_notes": None}
    cross_count = 0
    signal_flags = []

    if incident.fingerprint:
        fp_repo = FingerprintRepository(session)
        cache_entry = await fp_repo.get_cache_entry(incident.fingerprint, incident.endpoint_id)
        if cache_entry:
            match_data["occurrence_count"] = cache_entry.occurrence_count
            match_data["avg_resolution_ms"] = cache_entry.avg_resolution_ms
            match_data["last_resolution_notes"] = cache_entry.last_resolution_notes
            signal_flags = cache_entry.signal_flags or []

        cross = await fp_repo.get_cross_endpoint_matches(
            incident.fingerprint, tenant_id, incident.endpoint_id
        )
        cross_count = len(cross)

    narrative_svc = NarrativeService(llm=llm_client)

    # Get endpoint name
    from app.models.api_endpoint import ApiEndpoint
    ep = await session.get(ApiEndpoint, incident.endpoint_id)
    ep_name = ep.name if ep else "Unknown"

    narrative = await narrative_svc.generate(
        endpoint_name=ep_name,
        severity=incident.severity,
        signal_flags=signal_flags,
        anomaly_reasoning=incident.title,
        occurrence_count=match_data["occurrence_count"],
        avg_resolution_ms=match_data["avg_resolution_ms"],
        last_resolution_notes=match_data["last_resolution_notes"],
        cross_endpoint_count=cross_count,
    )

    incident.narrative = narrative
    await session.commit()

    return {"narrative": narrative}


@router.post("/{incident_id}/notes", response_model=IncidentRead, dependencies=[RequireWrite])
async def add_note(
    incident_id: uuid.UUID,
    data: IncidentNoteCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.add_note(incident_id, data, tenant_id)
