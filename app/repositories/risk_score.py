import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.risk_score import RiskScore


class RiskScoreRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, risk_score: RiskScore) -> RiskScore:
        self._session.add(risk_score)
        await self._session.flush()
        return risk_score

    async def get_by_id(
        self, score_id: uuid.UUID, *, tenant_id: uuid.UUID | None = None
    ) -> RiskScore | None:
        if tenant_id is None:
            return await self._session.get(RiskScore, score_id)
        from app.models.api_run import ApiRun

        result = await self._session.execute(
            select(RiskScore)
            .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
            .where(RiskScore.id == score_id, ApiRun.organization_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_run_id(
        self, run_id: uuid.UUID, *, tenant_id: uuid.UUID | None = None
    ) -> RiskScore | None:
        if tenant_id is None:
            result = await self._session.execute(
                select(RiskScore).where(RiskScore.api_run_id == run_id)
            )
            return result.scalar_one_or_none()
        from app.models.api_run import ApiRun

        result = await self._session.execute(
            select(RiskScore)
            .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
            .where(RiskScore.api_run_id == run_id, ApiRun.organization_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_latest_by_endpoint(
        self, endpoint_id: uuid.UUID, *, tenant_id: uuid.UUID | None = None
    ) -> RiskScore | None:
        """Most recent risk score for an endpoint."""
        from app.models.api_run import ApiRun

        stmt = (
            select(RiskScore)
            .join(ApiRun, RiskScore.api_run_id == ApiRun.id)
            .where(ApiRun.endpoint_id == endpoint_id)
            .order_by(RiskScore.created_at.desc())
            .limit(1)
        )
        if tenant_id is not None:
            stmt = stmt.where(ApiRun.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
