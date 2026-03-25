import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.incident import Incident
from app.models.incident_cluster import IncidentCluster


class ClusterRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, cluster: IncidentCluster) -> IncidentCluster:
        self._session.add(cluster)
        await self._session.flush()
        return cluster

    async def get_by_id(self, cluster_id: uuid.UUID, tenant_id: uuid.UUID) -> IncidentCluster | None:
        result = await self._session.execute(
            select(IncidentCluster)
            .options(joinedload(IncidentCluster.incidents))
            .where(IncidentCluster.id == cluster_id, IncidentCluster.organization_id == tenant_id)
        )
        return result.unique().scalar_one_or_none()

    async def list_by_org(
        self, tenant_id: uuid.UUID, *, status_filter: str | None = None, limit: int = 50
    ) -> list[IncidentCluster]:
        q = select(IncidentCluster).where(IncidentCluster.organization_id == tenant_id)
        if status_filter:
            q = q.where(IncidentCluster.status == status_filter)
        q = q.order_by(IncidentCluster.detected_at.desc()).limit(limit)
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def get_active_clusters(self, tenant_id: uuid.UUID) -> list[IncidentCluster]:
        result = await self._session.execute(
            select(IncidentCluster)
            .where(IncidentCluster.organization_id == tenant_id, IncidentCluster.status == "ACTIVE")
        )
        return list(result.scalars().all())

    async def get_recent_open_incidents(
        self, tenant_id: uuid.UUID, window_minutes: int = 15, exclude_endpoint_id: uuid.UUID | None = None
    ) -> list[Incident]:
        since = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        q = (
            select(Incident)
            .where(
                Incident.organization_id == tenant_id,
                Incident.status.in_(["OPEN", "INVESTIGATING"]),
                Incident.created_at >= since,
            )
        )
        if exclude_endpoint_id:
            q = q.where(Incident.endpoint_id != exclude_endpoint_id)
        result = await self._session.execute(q)
        return list(result.scalars().all())

    async def update(self, cluster: IncidentCluster) -> IncidentCluster:
        await self._session.flush()
        return cluster

    async def get_member_count(self, cluster_id: uuid.UUID) -> int:
        result = await self._session.scalar(
            select(func.count()).where(Incident.cluster_id == cluster_id)
        )
        return result or 0

    async def check_all_resolved(self, cluster_id: uuid.UUID) -> bool:
        unresolved = await self._session.scalar(
            select(func.count()).where(
                Incident.cluster_id == cluster_id,
                Incident.status != "RESOLVED",
            )
        )
        return (unresolved or 0) == 0
