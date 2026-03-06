"""
Repository for SecurityFinding — CRUD + aggregation queries.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security_finding import SecurityFinding


class SecurityFindingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, finding: SecurityFinding) -> SecurityFinding:
        self._session.add(finding)
        await self._session.flush()
        return finding

    async def create_many(self, findings: list[SecurityFinding]) -> list[SecurityFinding]:
        """Bulk insert multiple findings."""
        for f in findings:
            self._session.add(f)
        await self._session.flush()
        return findings

    async def get_for_endpoint(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID,
        *,
        limit: int = 50,
    ) -> list[SecurityFinding]:
        """All findings for a given endpoint, newest first."""
        result = await self._session.execute(
            select(SecurityFinding)
            .where(
                SecurityFinding.endpoint_id == endpoint_id,
                SecurityFinding.organization_id == tenant_id,
            )
            .order_by(SecurityFinding.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_for_org(
        self,
        tenant_id: uuid.UUID,
        *,
        limit: int = 100,
        finding_type: str | None = None,
    ) -> list[SecurityFinding]:
        """All findings for the organization, newest first."""
        stmt = (
            select(SecurityFinding)
            .where(SecurityFinding.organization_id == tenant_id)
            .order_by(SecurityFinding.created_at.desc())
            .limit(limit)
        )
        if finding_type:
            stmt = stmt.where(SecurityFinding.finding_type == finding_type)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_stats(
        self,
        tenant_id: uuid.UUID,
        *,
        days: int = 30,
    ) -> dict:
        """
        Aggregate stats: total findings, by type, by severity, affected endpoints.
        """
        since = datetime.now(timezone.utc) - timedelta(days=days)
        base = select(SecurityFinding).where(
            SecurityFinding.organization_id == tenant_id,
            SecurityFinding.created_at >= since,
        )

        # Total count
        total_q = select(func.count()).select_from(base.subquery())
        total_result = await self._session.execute(total_q)
        total = total_result.scalar() or 0

        # By type
        type_q = (
            select(
                SecurityFinding.finding_type,
                func.count().label("count"),
            )
            .where(
                SecurityFinding.organization_id == tenant_id,
                SecurityFinding.created_at >= since,
            )
            .group_by(SecurityFinding.finding_type)
            .order_by(func.count().desc())
        )
        type_result = await self._session.execute(type_q)
        by_type = [{"type": row[0], "count": row[1]} for row in type_result.all()]

        # By severity
        sev_q = (
            select(
                SecurityFinding.severity,
                func.count().label("count"),
            )
            .where(
                SecurityFinding.organization_id == tenant_id,
                SecurityFinding.created_at >= since,
            )
            .group_by(SecurityFinding.severity)
            .order_by(func.count().desc())
        )
        sev_result = await self._session.execute(sev_q)
        by_severity = [{"severity": row[0], "count": row[1]} for row in sev_result.all()]

        # Affected endpoints count
        ep_q = (
            select(func.count(func.distinct(SecurityFinding.endpoint_id)))
            .where(
                SecurityFinding.organization_id == tenant_id,
                SecurityFinding.created_at >= since,
            )
        )
        ep_result = await self._session.execute(ep_q)
        affected_endpoints = ep_result.scalar() or 0

        return {
            "total_findings": total,
            "by_type": by_type,
            "by_severity": by_severity,
            "affected_endpoints": affected_endpoints,
            "period_days": days,
        }

    async def get_for_run(
        self,
        run_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> list[SecurityFinding]:
        """Findings for a specific pipeline run."""
        result = await self._session.execute(
            select(SecurityFinding)
            .where(
                SecurityFinding.api_run_id == run_id,
                SecurityFinding.organization_id == tenant_id,
            )
            .order_by(SecurityFinding.created_at.desc())
        )
        return list(result.scalars().all())
