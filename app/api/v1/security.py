"""
Security API — credential leak findings.

Endpoints:
  GET /security/findings                → all findings for org (paginated)
  GET /security/findings/{endpoint_id}  → findings for endpoint
  GET /security/stats                   → aggregate stats
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.security_finding import SecurityFindingRepository
from app.schemas.security_finding import SecurityFindingResponse, SecurityStatsResponse

router = APIRouter(prefix="/security", tags=["security"])


def _to_response(f) -> SecurityFindingResponse:
    return SecurityFindingResponse(
        id=str(f.id),
        api_run_id=str(f.api_run_id),
        endpoint_id=str(f.endpoint_id),
        finding_type=f.finding_type,
        pattern_name=f.pattern_name,
        field_path=f.field_path,
        severity=f.severity,
        redacted_preview=f.redacted_preview,
        match_count=f.match_count,
        created_at=f.created_at,
    )


@router.get("/findings", response_model=list[SecurityFindingResponse])
async def list_findings(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(100, ge=1, le=500),
    finding_type: str | None = Query(None),
):
    """All security findings for the organization."""
    repo = SecurityFindingRepository(session)
    findings = await repo.get_for_org(
        tenant_id, limit=limit, finding_type=finding_type
    )
    return [_to_response(f) for f in findings]


@router.get(
    "/findings/{endpoint_id}",
    response_model=list[SecurityFindingResponse],
)
async def list_endpoint_findings(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    limit: int = Query(50, ge=1, le=500),
):
    """Security findings for a specific endpoint."""
    repo = SecurityFindingRepository(session)
    findings = await repo.get_for_endpoint(endpoint_id, tenant_id, limit=limit)
    return [_to_response(f) for f in findings]


@router.get("/stats", response_model=SecurityStatsResponse)
async def security_stats(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    days: int = Query(30, ge=1, le=365),
):
    """Aggregate security stats: total findings, by type, by severity."""
    repo = SecurityFindingRepository(session)
    stats = await repo.get_stats(tenant_id, days=days)
    return SecurityStatsResponse(**stats)
