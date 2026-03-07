import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.incident import Incident, IncidentEvent


class IncidentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Incidents ──────────────────────────────────────────────────────

    async def create(self, incident: Incident) -> Incident:
        self._session.add(incident)
        await self._session.flush()
        await self._session.refresh(incident)
        return incident

    async def get_by_id(
        self,
        incident_id: uuid.UUID,
        *,
        tenant_id: Optional[uuid.UUID] = None,
    ) -> Optional[Incident]:
        stmt = select(Incident).where(Incident.id == incident_id)
        if tenant_id is not None:
            stmt = stmt.where(Incident.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_org(
        self,
        tenant_id: uuid.UUID,
        *,
        status_filter: Optional[str] = None,
        limit: int = 50,
    ) -> list[Incident]:
        stmt = (
            select(Incident)
            .options(selectinload(Incident.endpoint))
            .where(Incident.organization_id == tenant_id)
            .order_by(Incident.created_at.desc())
            .limit(limit)
        )
        if status_filter:
            stmt = stmt.where(Incident.status == status_filter)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: Optional[uuid.UUID] = None,
        limit: int = 20,
    ) -> list[Incident]:
        stmt = (
            select(Incident)
            .where(Incident.endpoint_id == endpoint_id)
            .order_by(Incident.created_at.desc())
            .limit(limit)
        )
        if tenant_id is not None:
            stmt = stmt.where(Incident.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_open_for_endpoint(
        self,
        endpoint_id: uuid.UUID,
    ) -> Optional[Incident]:
        """Return the first OPEN or INVESTIGATING incident for an endpoint."""
        stmt = (
            select(Incident)
            .where(
                Incident.endpoint_id == endpoint_id,
                Incident.status.in_(["OPEN", "INVESTIGATING"]),
            )
            .order_by(Incident.created_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, incident: Incident) -> Incident:
        await self._session.flush()
        await self._session.refresh(incident)
        return incident

    # ── Events ─────────────────────────────────────────────────────────

    async def add_event(self, event: IncidentEvent) -> IncidentEvent:
        self._session.add(event)
        await self._session.flush()
        await self._session.refresh(event)
        return event

    async def get_events(
        self,
        incident_id: uuid.UUID,
        *,
        limit: int = 50,
    ) -> list[IncidentEvent]:
        stmt = (
            select(IncidentEvent)
            .where(IncidentEvent.incident_id == incident_id)
            .order_by(IncidentEvent.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
