"""
Dashboard aggregate stats endpoint.

Returns pre-computed KPI values in a single query so the frontend
dashboard doesn't need N+1 requests per endpoint.
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.models.anomaly import Anomaly
from app.models.api_endpoint import ApiEndpoint
from app.models.api_run import ApiRun
from app.models.risk_score import RiskScore

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStatsResponse(BaseModel):
    total_endpoints: int
    active_monitors: int
    anomalies_24h: int
    avg_risk_score: float
    avg_risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL


def _score_to_level(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Return aggregate KPIs for the current tenant's dashboard."""

    # 1. Total & active endpoint count
    ep_count: int = await session.scalar(
        select(func.count()).where(
            ApiEndpoint.organization_id == tenant_id,
        )
    ) or 0

    # 2. Anomalies in the last 24 hours
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    anomaly_count: int = await session.scalar(
        select(func.count())
        .select_from(Anomaly)
        .join(ApiRun, Anomaly.api_run_id == ApiRun.id)
        .where(
            ApiRun.organization_id == tenant_id,
            Anomaly.anomaly_detected.is_(True),
            Anomaly.created_at >= since,
        )
    ) or 0

    # 3. Average risk score — latest score per endpoint, then average
    #    Sub-query: for each endpoint, get the most recent risk score
    latest_run_sq = (
        select(
            ApiRun.endpoint_id,
            func.max(ApiRun.created_at).label("max_created"),
        )
        .where(ApiRun.organization_id == tenant_id)
        .group_by(ApiRun.endpoint_id)
        .subquery()
    )

    latest_risk_sq = (
        select(RiskScore.calculated_score)
        .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
        .join(
            latest_run_sq,
            (ApiRun.endpoint_id == latest_run_sq.c.endpoint_id)
            & (ApiRun.created_at == latest_run_sq.c.max_created),
        )
        .subquery()
    )

    avg_risk: float = (
        await session.scalar(select(func.avg(latest_risk_sq.c.calculated_score)))
    ) or 0.0

    avg_risk = round(avg_risk, 1)

    return DashboardStatsResponse(
        total_endpoints=ep_count,
        active_monitors=ep_count,  # all endpoints are active monitors
        anomalies_24h=anomaly_count,
        avg_risk_score=avg_risk,
        avg_risk_level=_score_to_level(avg_risk),
    )
