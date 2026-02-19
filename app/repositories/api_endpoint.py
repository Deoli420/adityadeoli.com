import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_endpoint import ApiEndpoint


class ApiEndpointRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_all(self, tenant_id: uuid.UUID | None = None) -> list[ApiEndpoint]:
        stmt = select(ApiEndpoint)
        if tenant_id is not None:
            stmt = stmt.where(ApiEndpoint.organization_id == tenant_id)
        stmt = stmt.order_by(ApiEndpoint.created_at.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> ApiEndpoint | None:
        endpoint = await self._session.get(ApiEndpoint, endpoint_id)
        if endpoint and tenant_id and endpoint.organization_id != tenant_id:
            return None  # Cross-tenant access blocked
        return endpoint

    async def create(self, endpoint: ApiEndpoint) -> ApiEndpoint:
        self._session.add(endpoint)
        await self._session.flush()
        return endpoint

    async def update(self, endpoint: ApiEndpoint) -> ApiEndpoint:
        await self._session.flush()
        return endpoint

    async def delete(self, endpoint: ApiEndpoint) -> None:
        await self._session.delete(endpoint)
