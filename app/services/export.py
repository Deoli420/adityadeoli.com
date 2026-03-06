"""
Export service — generates CSV data for runs, incidents, risk scores, and SLA.

Each method returns an async generator of CSV-formatted strings (header + rows),
ready to be streamed via StreamingResponse.
"""

import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anomaly import Anomaly
from app.models.api_endpoint import ApiEndpoint
from app.models.api_run import ApiRun
from app.models.endpoint_sla import EndpointSLA
from app.models.incident import Incident, IncidentEvent
from app.models.risk_score import RiskScore


def _write_row(writer: csv.writer, buf: io.StringIO, row: list) -> str:
    """Write a single CSV row and return the string."""
    buf.seek(0)
    buf.truncate(0)
    writer.writerow(row)
    return buf.getvalue()


class ExportService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Runs Export ────────────────────────────────────────────────────────

    async def export_runs_csv(
        self,
        tenant_id: uuid.UUID,
        *,
        endpoint_ids: Optional[list[uuid.UUID]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream CSV of monitoring runs."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        header = [
            "run_id",
            "endpoint_id",
            "endpoint_name",
            "timestamp",
            "status_code",
            "response_time_ms",
            "is_success",
            "error_message",
        ]
        yield _write_row(writer, buf, header)

        # Build query
        stmt = (
            select(ApiRun, ApiEndpoint.name.label("ep_name"))
            .join(ApiEndpoint, ApiRun.endpoint_id == ApiEndpoint.id)
            .where(ApiRun.organization_id == tenant_id)
            .order_by(ApiRun.created_at.desc())
        )
        if endpoint_ids:
            stmt = stmt.where(ApiRun.endpoint_id.in_(endpoint_ids))
        if date_from:
            stmt = stmt.where(ApiRun.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ApiRun.created_at <= date_to)

        # Limit to 10,000 rows for safety
        stmt = stmt.limit(10_000)

        result = await self._session.execute(stmt)
        for run, ep_name in result:
            yield _write_row(writer, buf, [
                str(run.id),
                str(run.endpoint_id),
                ep_name,
                run.created_at.isoformat() if run.created_at else "",
                run.status_code or "",
                round(run.response_time_ms, 2) if run.response_time_ms else "",
                run.is_success,
                run.error_message or "",
            ])

    # ── Incidents Export ───────────────────────────────────────────────────

    async def export_incidents_csv(
        self,
        tenant_id: uuid.UUID,
        *,
        endpoint_ids: Optional[list[uuid.UUID]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream CSV of incidents."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        header = [
            "incident_id",
            "endpoint_id",
            "endpoint_name",
            "title",
            "status",
            "severity",
            "trigger_type",
            "started_at",
            "acknowledged_at",
            "resolved_at",
            "duration_minutes",
        ]
        yield _write_row(writer, buf, header)

        stmt = (
            select(Incident, ApiEndpoint.name.label("ep_name"))
            .join(ApiEndpoint, Incident.endpoint_id == ApiEndpoint.id)
            .where(Incident.organization_id == tenant_id)
            .order_by(Incident.started_at.desc())
        )
        if endpoint_ids:
            stmt = stmt.where(Incident.endpoint_id.in_(endpoint_ids))
        if date_from:
            stmt = stmt.where(Incident.started_at >= date_from)
        if date_to:
            stmt = stmt.where(Incident.started_at <= date_to)
        stmt = stmt.limit(5_000)

        result = await self._session.execute(stmt)
        for incident, ep_name in result:
            duration = ""
            if incident.resolved_at and incident.started_at:
                delta = incident.resolved_at - incident.started_at
                duration = round(delta.total_seconds() / 60, 1)

            yield _write_row(writer, buf, [
                str(incident.id),
                str(incident.endpoint_id),
                ep_name,
                incident.title or "",
                incident.status,
                incident.severity,
                incident.trigger_type or "",
                incident.started_at.isoformat() if incident.started_at else "",
                incident.acknowledged_at.isoformat() if incident.acknowledged_at else "",
                incident.resolved_at.isoformat() if incident.resolved_at else "",
                duration,
            ])

    # ── Risk Scores Export ─────────────────────────────────────────────────

    async def export_risk_csv(
        self,
        tenant_id: uuid.UUID,
        *,
        endpoint_ids: Optional[list[uuid.UUID]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream CSV of risk scores with anomaly data."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        header = [
            "risk_id",
            "endpoint_id",
            "endpoint_name",
            "timestamp",
            "risk_score",
            "risk_level",
            "anomaly_detected",
            "anomaly_severity",
            "anomaly_reasoning",
        ]
        yield _write_row(writer, buf, header)

        stmt = (
            select(
                RiskScore,
                ApiRun.endpoint_id,
                ApiEndpoint.name.label("ep_name"),
                Anomaly.anomaly_detected,
                Anomaly.severity_score.label("anomaly_severity"),
                Anomaly.reasoning.label("anomaly_reasoning"),
            )
            .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
            .join(ApiEndpoint, ApiRun.endpoint_id == ApiEndpoint.id)
            .outerjoin(Anomaly, Anomaly.api_run_id == ApiRun.id)
            .where(ApiRun.organization_id == tenant_id)
            .order_by(RiskScore.created_at.desc())
        )
        if endpoint_ids:
            stmt = stmt.where(ApiRun.endpoint_id.in_(endpoint_ids))
        if date_from:
            stmt = stmt.where(RiskScore.created_at >= date_from)
        if date_to:
            stmt = stmt.where(RiskScore.created_at <= date_to)
        stmt = stmt.limit(10_000)

        result = await self._session.execute(stmt)
        for risk, ep_id, ep_name, anom_detected, anom_sev, anom_reason in result:
            yield _write_row(writer, buf, [
                str(risk.id),
                str(ep_id),
                ep_name,
                risk.created_at.isoformat() if risk.created_at else "",
                risk.calculated_score,
                risk.risk_level,
                anom_detected or False,
                anom_sev or "",
                (anom_reason or "")[:200],  # Truncate long reasoning
            ])

    # ── SLA Report ─────────────────────────────────────────────────────────

    _WINDOW_HOURS = {"24h": 24, "7d": 168, "30d": 720}

    async def export_sla_csv(
        self,
        tenant_id: uuid.UUID,
        *,
        endpoint_ids: Optional[list[uuid.UUID]] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream CSV of SLA compliance for all endpoints with active SLAs."""
        buf = io.StringIO()
        writer = csv.writer(buf)

        header = [
            "endpoint_id",
            "endpoint_name",
            "sla_target_percent",
            "uptime_window",
            "current_uptime_percent",
            "total_runs",
            "successful_runs",
            "is_breached",
        ]
        yield _write_row(writer, buf, header)

        stmt = (
            select(EndpointSLA, ApiEndpoint.name.label("ep_name"))
            .join(ApiEndpoint, EndpointSLA.endpoint_id == ApiEndpoint.id)
            .where(
                EndpointSLA.organization_id == tenant_id,
                EndpointSLA.is_active.is_(True),
            )
        )
        if endpoint_ids:
            stmt = stmt.where(EndpointSLA.endpoint_id.in_(endpoint_ids))

        sla_rows = await self._session.execute(stmt)
        now = datetime.now(timezone.utc)

        for sla, ep_name in sla_rows:
            hours = self._WINDOW_HOURS.get(sla.uptime_window, 24)
            since = now - timedelta(hours=hours)

            base = [
                ApiRun.endpoint_id == sla.endpoint_id,
                ApiRun.created_at >= since,
            ]
            total: int = await self._session.scalar(
                select(func.count()).where(*base)
            ) or 0
            successes: int = await self._session.scalar(
                select(func.count()).where(*base, ApiRun.is_success.is_(True))
            ) or 0

            uptime = round((successes / total * 100) if total else 100.0, 4)

            yield _write_row(writer, buf, [
                str(sla.endpoint_id),
                ep_name,
                sla.sla_target_percent,
                sla.uptime_window,
                uptime,
                total,
                successes,
                uptime < sla.sla_target_percent,
            ])
