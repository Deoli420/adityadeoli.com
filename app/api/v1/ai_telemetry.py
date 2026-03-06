"""
AI Telemetry API — FinOps dashboard for LLM usage, cost, and health.

Endpoints:
  GET /stats        → aggregate KPIs (total calls, tokens, cost, latency)
  GET /daily        → daily breakdown for time-series chart
  GET /by-endpoint  → per-endpoint AI usage ranking
  GET /health       → LLM health (success rate, last error)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.core.config import settings
from app.db.session import get_session
from app.repositories.ai_telemetry import AiTelemetryRepository
from app.schemas.ai_telemetry import (
    AiHealthResponse,
    AiTelemetryStats,
    AiTelemetryStatsResponse,
    DailyBreakdownPoint,
    DailyBreakdownResponse,
    PerEndpointUsage,
    PerEndpointUsageResponse,
)

router = APIRouter(prefix="/ai-telemetry", tags=["ai-telemetry"])


@router.get("/stats", response_model=AiTelemetryStatsResponse)
async def get_ai_stats(
    user: CurrentUser,
    tenant_id: TenantId,
    days: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
):
    """Aggregate AI usage KPIs for the current tenant."""
    repo = AiTelemetryRepository(session)
    data = await repo.get_stats(tenant_id, days=days)
    return AiTelemetryStatsResponse(stats=AiTelemetryStats(**data))


@router.get("/daily", response_model=DailyBreakdownResponse)
async def get_daily_breakdown(
    user: CurrentUser,
    tenant_id: TenantId,
    days: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
):
    """Daily AI usage breakdown for time-series chart."""
    repo = AiTelemetryRepository(session)
    rows = await repo.get_daily_breakdown(tenant_id, days=days)
    points = [DailyBreakdownPoint(**r) for r in rows]
    return DailyBreakdownResponse(points=points)


@router.get("/by-endpoint", response_model=PerEndpointUsageResponse)
async def get_per_endpoint(
    user: CurrentUser,
    tenant_id: TenantId,
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=20, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    """Per-endpoint AI usage ranking — for cost-by-endpoint chart."""
    repo = AiTelemetryRepository(session)
    rows = await repo.get_per_endpoint(tenant_id, days=days, limit=limit)
    endpoints = [PerEndpointUsage(**r) for r in rows]
    return PerEndpointUsageResponse(endpoints=endpoints)


@router.get("/health", response_model=AiHealthResponse)
async def get_ai_health(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """LLM health metrics — success rate, errors, latency."""
    repo = AiTelemetryRepository(session)
    data = await repo.get_health(tenant_id)
    return AiHealthResponse(
        total_calls=data["total_calls"],
        success_rate=data["success_rate"],
        error_rate=data["error_rate"],
        avg_latency_ms=data["avg_latency_ms"],
        last_error=data["last_error"],
        last_error_at=data["last_error_at"],
        model_name=settings.OPENAI_MODEL,
    )
