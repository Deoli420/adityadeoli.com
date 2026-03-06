import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
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


@router.post("/", response_model=IncidentRead, status_code=201)
async def create_incident(
    data: IncidentCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.create_incident(data, tenant_id)


@router.patch("/{incident_id}/status", response_model=IncidentRead)
async def update_status(
    incident_id: uuid.UUID,
    data: IncidentStatusUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.update_status(incident_id, data, tenant_id)


@router.post("/{incident_id}/notes", response_model=IncidentRead)
async def add_note(
    incident_id: uuid.UUID,
    data: IncidentNoteCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: IncidentService = Depends(_get_service),
):
    return await service.add_note(incident_id, data, tenant_id)
