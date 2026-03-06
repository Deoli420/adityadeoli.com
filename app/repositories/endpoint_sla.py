import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.endpoint_sla import EndpointSLA


class EndpointSLARepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, sla: EndpointSLA) -> EndpointSLA:
        self._session.add(sla)
        await self._session.flush()
        return sla

    async def get_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID | None = None,
    ) -> EndpointSLA | None:
        stmt = select(EndpointSLA).where(EndpointSLA.endpoint_id == endpoint_id)
        if tenant_id is not None:
            stmt = stmt.where(EndpointSLA.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_active(
        self,
        *,
        tenant_id: uuid.UUID | None = None,
    ) -> list[EndpointSLA]:
        stmt = select(EndpointSLA).where(EndpointSLA.is_active.is_(True))
        if tenant_id is not None:
            stmt = stmt.where(EndpointSLA.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, sla: EndpointSLA) -> EndpointSLA:
        await self._session.flush()
        return sla

    async def delete(self, sla: EndpointSLA) -> None:
        await self._session.delete(sla)
        await self._session.flush()
