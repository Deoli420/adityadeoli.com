import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_run import ApiRun


class ApiRunRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, run: ApiRun) -> ApiRun:
        self._session.add(run)
        await self._session.flush()
        return run

    async def get_by_id(
        self, run_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> ApiRun | None:
        run = await self._session.get(ApiRun, run_id)
        if run and tenant_id and run.organization_id != tenant_id:
            return None
        return run

    async def get_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[ApiRun]:
        stmt = (
            select(ApiRun)
            .where(ApiRun.endpoint_id == endpoint_id)
            .order_by(ApiRun.created_at.desc())
            .limit(limit)
        )
        if tenant_id is not None:
            stmt = stmt.where(ApiRun.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent_times(
        self, endpoint_id: uuid.UUID, *, limit: int = 20
    ) -> list[float]:
        """Return the last N response times for rolling-average calculations."""
        result = await self._session.execute(
            select(ApiRun.response_time_ms)
            .where(
                ApiRun.endpoint_id == endpoint_id,
                ApiRun.response_time_ms.is_not(None),
            )
            .order_by(ApiRun.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_failure_rate(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID | None = None,
    ) -> float:
        """Failure rate over all recorded runs for an endpoint."""
        base_filters = [ApiRun.endpoint_id == endpoint_id]
        if tenant_id is not None:
            base_filters.append(ApiRun.organization_id == tenant_id)

        total = await self._session.scalar(
            select(func.count()).where(*base_filters)
        )
        if not total:
            return 0.0
        failures = await self._session.scalar(
            select(func.count()).where(
                *base_filters,
                ApiRun.is_success.is_(False),
            )
        )
        return round((failures or 0) / total * 100, 2)
