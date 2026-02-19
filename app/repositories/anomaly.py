import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anomaly import Anomaly


class AnomalyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, anomaly: Anomaly) -> Anomaly:
        self._session.add(anomaly)
        await self._session.flush()
        return anomaly

    async def get_by_id(
        self, anomaly_id: uuid.UUID, *, tenant_id: uuid.UUID | None = None
    ) -> Anomaly | None:
        if tenant_id is None:
            return await self._session.get(Anomaly, anomaly_id)
        # Tenant-scoped lookup via joined ApiRun
        from app.models.api_run import ApiRun

        result = await self._session.execute(
            select(Anomaly)
            .join(ApiRun, Anomaly.api_run_id == ApiRun.id)
            .where(Anomaly.id == anomaly_id, ApiRun.organization_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_run_id(
        self, run_id: uuid.UUID, *, tenant_id: uuid.UUID | None = None
    ) -> Anomaly | None:
        if tenant_id is None:
            result = await self._session.execute(
                select(Anomaly).where(Anomaly.api_run_id == run_id)
            )
            return result.scalar_one_or_none()
        from app.models.api_run import ApiRun

        result = await self._session.execute(
            select(Anomaly)
            .join(ApiRun, Anomaly.api_run_id == ApiRun.id)
            .where(Anomaly.api_run_id == run_id, ApiRun.organization_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID | None = None,
        limit: int = 50,
    ) -> list[Anomaly]:
        """All anomalies for a given endpoint, across its runs."""
        from app.models.api_run import ApiRun

        stmt = (
            select(Anomaly)
            .join(ApiRun, Anomaly.api_run_id == ApiRun.id)
            .where(ApiRun.endpoint_id == endpoint_id)
            .order_by(Anomaly.created_at.desc())
            .limit(limit)
        )
        if tenant_id is not None:
            stmt = stmt.where(ApiRun.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
