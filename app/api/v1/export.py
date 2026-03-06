"""
Export endpoints — stream CSV downloads for runs, incidents, risks, and SLA.

All exports are tenant-scoped and support optional date range + endpoint filtering.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.services.export import ExportService

router = APIRouter(prefix="/export", tags=["export"])


def _get_service(session: AsyncSession = Depends(get_session)) -> ExportService:
    return ExportService(session)


def _parse_endpoint_ids(raw: Optional[str]) -> Optional[list[uuid.UUID]]:
    """Parse comma-separated endpoint IDs from query string."""
    if not raw:
        return None
    try:
        return [uuid.UUID(eid.strip()) for eid in raw.split(",") if eid.strip()]
    except ValueError:
        return None


@router.get("/runs")
async def export_runs(
    user: CurrentUser,
    tenant_id: TenantId,
    endpoint_ids: Optional[str] = Query(
        default=None, description="Comma-separated endpoint UUIDs"
    ),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    service: ExportService = Depends(_get_service),
):
    """Download monitoring runs as CSV."""
    parsed_ids = _parse_endpoint_ids(endpoint_ids)
    generator = service.export_runs_csv(
        tenant_id,
        endpoint_ids=parsed_ids,
        date_from=date_from,
        date_to=date_to,
    )
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_runs.csv"},
    )


@router.get("/incidents")
async def export_incidents(
    user: CurrentUser,
    tenant_id: TenantId,
    endpoint_ids: Optional[str] = Query(
        default=None, description="Comma-separated endpoint UUIDs"
    ),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    service: ExportService = Depends(_get_service),
):
    """Download incidents as CSV."""
    parsed_ids = _parse_endpoint_ids(endpoint_ids)
    generator = service.export_incidents_csv(
        tenant_id,
        endpoint_ids=parsed_ids,
        date_from=date_from,
        date_to=date_to,
    )
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_incidents.csv"},
    )


@router.get("/risk-scores")
async def export_risk_scores(
    user: CurrentUser,
    tenant_id: TenantId,
    endpoint_ids: Optional[str] = Query(
        default=None, description="Comma-separated endpoint UUIDs"
    ),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    service: ExportService = Depends(_get_service),
):
    """Download risk scores as CSV."""
    parsed_ids = _parse_endpoint_ids(endpoint_ids)
    generator = service.export_risk_csv(
        tenant_id,
        endpoint_ids=parsed_ids,
        date_from=date_from,
        date_to=date_to,
    )
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_risk_scores.csv"},
    )


@router.get("/sla")
async def export_sla(
    user: CurrentUser,
    tenant_id: TenantId,
    endpoint_ids: Optional[str] = Query(
        default=None, description="Comma-separated endpoint UUIDs"
    ),
    service: ExportService = Depends(_get_service),
):
    """Download SLA compliance report as CSV."""
    parsed_ids = _parse_endpoint_ids(endpoint_ids)
    generator = service.export_sla_csv(
        tenant_id,
        endpoint_ids=parsed_ids,
    )
    return StreamingResponse(
        generator,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sentinel_sla_report.csv"},
    )
