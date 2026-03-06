"""
Dashboard aggregate stats + chart endpoints.

Returns pre-computed KPI values in a single query so the frontend
dashboard doesn't need N+1 requests per endpoint.

New chart endpoints (Phase 1):
  - /response-trends   → hourly avg response times
  - /top-failures      → worst endpoints by failure rate
  - /risk-distribution → count of endpoints per risk level
  - /uptime-overview   → SLA status per endpoint
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.models.anomaly import Anomaly
from app.models.api_endpoint import ApiEndpoint
from app.models.api_run import ApiRun
from app.models.endpoint_sla import EndpointSLA
from app.models.risk_score import RiskScore
from app.schemas.dashboard import (
    ResponseTrendsResponse,
    RiskDistribution,
    TopFailureEntry,
    TopFailuresResponse,
    TrendPoint,
    UptimeOverviewEntry,
    UptimeOverviewResponse,
)

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


# ── Response Trends ────────────────────────────────────────────────────────


@router.get("/response-trends", response_model=ResponseTrendsResponse)
async def get_response_trends(
    user: CurrentUser,
    tenant_id: TenantId,
    hours: int = Query(default=24, ge=1, le=168),
    session: AsyncSession = Depends(get_session),
):
    """Hourly average response time across all tenant endpoints."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    hour_trunc = func.date_trunc("hour", ApiRun.created_at)

    rows = await session.execute(
        select(
            hour_trunc.label("hour"),
            func.avg(ApiRun.response_time_ms).label("avg_ms"),
            func.count().label("cnt"),
        )
        .where(
            ApiRun.organization_id == tenant_id,
            ApiRun.created_at >= since,
            ApiRun.response_time_ms.is_not(None),
        )
        .group_by(hour_trunc)
        .order_by(hour_trunc)
    )

    points = [
        TrendPoint(
            hour=row.hour.isoformat(),
            avg_response_time_ms=round(row.avg_ms, 2),
            request_count=row.cnt,
        )
        for row in rows
    ]
    return ResponseTrendsResponse(points=points)


# ── Top Failures ───────────────────────────────────────────────────────────


@router.get("/top-failures", response_model=TopFailuresResponse)
async def get_top_failures(
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=5, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
):
    """Endpoints ranked by failure rate, with latest risk level."""
    # Latest risk per endpoint (subquery)
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
        select(
            ApiRun.endpoint_id.label("ep_id"),
            RiskScore.calculated_score,
            RiskScore.risk_level,
        )
        .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
        .join(
            latest_run_sq,
            (ApiRun.endpoint_id == latest_run_sq.c.endpoint_id)
            & (ApiRun.created_at == latest_run_sq.c.max_created),
        )
        .subquery()
    )

    # Failure rate per endpoint
    total_sq = (
        select(
            ApiRun.endpoint_id.label("ep_id"),
            func.count().label("total"),
            func.count()
            .filter(ApiRun.is_success.is_(False))
            .label("failures"),
        )
        .where(ApiRun.organization_id == tenant_id)
        .group_by(ApiRun.endpoint_id)
        .subquery()
    )

    rows = await session.execute(
        select(
            ApiEndpoint.id,
            ApiEndpoint.name,
            total_sq.c.total,
            total_sq.c.failures,
            latest_risk_sq.c.calculated_score,
            latest_risk_sq.c.risk_level,
        )
        .join(total_sq, ApiEndpoint.id == total_sq.c.ep_id)
        .outerjoin(latest_risk_sq, ApiEndpoint.id == latest_risk_sq.c.ep_id)
        .where(ApiEndpoint.organization_id == tenant_id)
        .order_by((total_sq.c.failures * 1.0 / total_sq.c.total).desc())
        .limit(limit)
    )

    entries = [
        TopFailureEntry(
            endpoint_id=row.id,
            endpoint_name=row.name,
            failure_rate_percent=round(
                (row.failures / row.total * 100) if row.total else 0.0, 2
            ),
            risk_level=row.risk_level or "LOW",
            risk_score=round(row.calculated_score or 0.0, 1),
        )
        for row in rows
    ]
    return TopFailuresResponse(endpoints=entries)


# ── Risk Distribution ──────────────────────────────────────────────────────


@router.get("/risk-distribution", response_model=RiskDistribution)
async def get_risk_distribution(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Count of endpoints by latest risk level."""
    # Latest risk per endpoint
    latest_run_sq = (
        select(
            ApiRun.endpoint_id,
            func.max(ApiRun.created_at).label("max_created"),
        )
        .where(ApiRun.organization_id == tenant_id)
        .group_by(ApiRun.endpoint_id)
        .subquery()
    )

    rows = await session.execute(
        select(
            RiskScore.risk_level,
            func.count().label("cnt"),
        )
        .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
        .join(
            latest_run_sq,
            (ApiRun.endpoint_id == latest_run_sq.c.endpoint_id)
            & (ApiRun.created_at == latest_run_sq.c.max_created),
        )
        .group_by(RiskScore.risk_level)
    )

    dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for row in rows:
        key = row.risk_level.lower()
        if key in dist:
            dist[key] = row.cnt
    return RiskDistribution(**dist)


# ── Uptime Overview ────────────────────────────────────────────────────────

_WINDOW_HOURS = {"24h": 24, "7d": 168, "30d": 720}


@router.get("/uptime-overview", response_model=UptimeOverviewResponse)
async def get_uptime_overview(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Uptime stats for each endpoint that has an active SLA config."""
    # Get all active SLAs for this tenant
    sla_rows = await session.execute(
        select(EndpointSLA, ApiEndpoint.name)
        .join(ApiEndpoint, EndpointSLA.endpoint_id == ApiEndpoint.id)
        .where(
            EndpointSLA.organization_id == tenant_id,
            EndpointSLA.is_active.is_(True),
        )
    )

    entries: list[UptimeOverviewEntry] = []
    now = datetime.now(timezone.utc)

    for sla, ep_name in sla_rows:
        hours = _WINDOW_HOURS.get(sla.uptime_window, 24)
        since = now - timedelta(hours=hours)

        base = [
            ApiRun.endpoint_id == sla.endpoint_id,
            ApiRun.created_at >= since,
        ]
        total: int = await session.scalar(
            select(func.count()).where(*base)
        ) or 0
        successes: int = await session.scalar(
            select(func.count()).where(*base, ApiRun.is_success.is_(True))
        ) or 0

        uptime = round((successes / total * 100) if total else 100.0, 4)
        entries.append(
            UptimeOverviewEntry(
                endpoint_id=sla.endpoint_id,
                endpoint_name=ep_name,
                uptime_percent=uptime,
                sla_target=sla.sla_target_percent,
                is_breached=uptime < sla.sla_target_percent,
            )
        )

    return UptimeOverviewResponse(entries=entries)
