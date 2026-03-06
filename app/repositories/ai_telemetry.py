"""
Repository for AI telemetry records — CRUD + aggregate queries for the dashboard.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Float, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_telemetry import AiTelemetryRecord
from app.models.api_endpoint import ApiEndpoint


class AiTelemetryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, record: AiTelemetryRecord) -> AiTelemetryRecord:
        self._session.add(record)
        await self._session.flush()
        return record

    # ── Aggregate stats ──────────────────────────────────────────────

    async def get_stats(
        self,
        tenant_id: uuid.UUID,
        *,
        days: int = 30,
    ) -> dict:
        """Aggregate KPIs for the AI telemetry dashboard."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        row = await self._session.execute(
            select(
                func.count().label("total_calls"),
                func.count()
                .filter(AiTelemetryRecord.success.is_(True))
                .label("successful_calls"),
                func.count()
                .filter(AiTelemetryRecord.success.is_(False))
                .label("failed_calls"),
                func.coalesce(func.sum(AiTelemetryRecord.total_tokens), 0).label(
                    "total_tokens"
                ),
                func.coalesce(func.sum(AiTelemetryRecord.prompt_tokens), 0).label(
                    "total_prompt_tokens"
                ),
                func.coalesce(
                    func.sum(AiTelemetryRecord.completion_tokens), 0
                ).label("total_completion_tokens"),
                func.coalesce(func.sum(AiTelemetryRecord.cost_usd), 0.0).label(
                    "total_cost_usd"
                ),
                func.coalesce(func.avg(AiTelemetryRecord.latency_ms), 0.0).label(
                    "avg_latency_ms"
                ),
            ).where(
                AiTelemetryRecord.organization_id == tenant_id,
                AiTelemetryRecord.created_at >= since,
            )
        )

        r = row.one()
        total = r.total_calls or 0
        return {
            "total_calls": total,
            "successful_calls": r.successful_calls or 0,
            "failed_calls": r.failed_calls or 0,
            "total_tokens": r.total_tokens,
            "total_prompt_tokens": r.total_prompt_tokens,
            "total_completion_tokens": r.total_completion_tokens,
            "total_cost_usd": round(float(r.total_cost_usd), 6),
            "avg_latency_ms": round(float(r.avg_latency_ms), 1),
            "avg_tokens_per_call": round(r.total_tokens / total, 1) if total else 0.0,
        }

    # ── Daily breakdown ──────────────────────────────────────────────

    async def get_daily_breakdown(
        self,
        tenant_id: uuid.UUID,
        *,
        days: int = 30,
    ) -> list[dict]:
        """Daily token usage + cost for the time-series chart."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        day_trunc = func.date_trunc("day", AiTelemetryRecord.created_at)

        rows = await self._session.execute(
            select(
                day_trunc.label("day"),
                func.count().label("calls"),
                func.coalesce(func.sum(AiTelemetryRecord.total_tokens), 0).label(
                    "tokens"
                ),
                func.coalesce(func.sum(AiTelemetryRecord.cost_usd), 0.0).label(
                    "cost_usd"
                ),
                func.coalesce(func.avg(AiTelemetryRecord.latency_ms), 0.0).label(
                    "avg_latency_ms"
                ),
            )
            .where(
                AiTelemetryRecord.organization_id == tenant_id,
                AiTelemetryRecord.created_at >= since,
            )
            .group_by(day_trunc)
            .order_by(day_trunc)
        )

        return [
            {
                "date": row.day.strftime("%Y-%m-%d"),
                "calls": row.calls,
                "tokens": row.tokens,
                "cost_usd": round(float(row.cost_usd), 6),
                "avg_latency_ms": round(float(row.avg_latency_ms), 1),
            }
            for row in rows
        ]

    # ── Per-endpoint usage ───────────────────────────────────────────

    async def get_per_endpoint(
        self,
        tenant_id: uuid.UUID,
        *,
        days: int = 30,
        limit: int = 20,
    ) -> list[dict]:
        """AI usage ranked by endpoint — for cost-by-endpoint chart."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        total_calls_col = func.count().label("total_calls")
        success_count = func.count().filter(
            AiTelemetryRecord.success.is_(True)
        )

        rows = await self._session.execute(
            select(
                AiTelemetryRecord.endpoint_id,
                ApiEndpoint.name.label("endpoint_name"),
                total_calls_col,
                func.coalesce(func.sum(AiTelemetryRecord.total_tokens), 0).label(
                    "total_tokens"
                ),
                func.coalesce(func.sum(AiTelemetryRecord.cost_usd), 0.0).label(
                    "total_cost_usd"
                ),
                func.coalesce(func.avg(AiTelemetryRecord.latency_ms), 0.0).label(
                    "avg_latency_ms"
                ),
                success_count.label("success_count"),
            )
            .join(
                ApiEndpoint,
                AiTelemetryRecord.endpoint_id == ApiEndpoint.id,
            )
            .where(
                AiTelemetryRecord.organization_id == tenant_id,
                AiTelemetryRecord.created_at >= since,
            )
            .group_by(AiTelemetryRecord.endpoint_id, ApiEndpoint.name)
            .order_by(func.sum(AiTelemetryRecord.cost_usd).desc())
            .limit(limit)
        )

        return [
            {
                "endpoint_id": row.endpoint_id,
                "endpoint_name": row.endpoint_name,
                "total_calls": row.total_calls,
                "total_tokens": row.total_tokens,
                "total_cost_usd": round(float(row.total_cost_usd), 6),
                "avg_latency_ms": round(float(row.avg_latency_ms), 1),
                "success_rate": round(
                    row.success_count / row.total_calls if row.total_calls else 0.0, 3
                ),
            }
            for row in rows
        ]

    # ── Health / errors ──────────────────────────────────────────────

    async def get_health(self, tenant_id: uuid.UUID) -> dict:
        """LLM health metrics — success rate, last error, etc."""
        row = await self._session.execute(
            select(
                func.count().label("total_calls"),
                func.count()
                .filter(AiTelemetryRecord.success.is_(True))
                .label("success_count"),
                func.count()
                .filter(AiTelemetryRecord.success.is_(False))
                .label("fail_count"),
                func.coalesce(func.avg(AiTelemetryRecord.latency_ms), 0.0).label(
                    "avg_latency_ms"
                ),
            ).where(AiTelemetryRecord.organization_id == tenant_id)
        )
        r = row.one()
        total = r.total_calls or 0

        # Latest error
        latest_error = await self._session.execute(
            select(
                AiTelemetryRecord.error_message,
                AiTelemetryRecord.created_at,
            )
            .where(
                AiTelemetryRecord.organization_id == tenant_id,
                AiTelemetryRecord.success.is_(False),
                AiTelemetryRecord.error_message.is_not(None),
            )
            .order_by(AiTelemetryRecord.created_at.desc())
            .limit(1)
        )
        err_row = latest_error.first()

        return {
            "total_calls": total,
            "success_rate": round(r.success_count / total, 3) if total else 0.0,
            "error_rate": round(r.fail_count / total, 3) if total else 0.0,
            "avg_latency_ms": round(float(r.avg_latency_ms), 1),
            "last_error": err_row.error_message if err_row else None,
            "last_error_at": err_row.created_at.isoformat() if err_row else None,
        }
