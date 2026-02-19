import uuid

from fastapi import HTTPException, status

from app.models.risk_score import RiskScore
from app.repositories.risk_score import RiskScoreRepository
from app.schemas.risk_score import RiskScoreCreate


class RiskScoreService:
    def __init__(self, repo: RiskScoreRepository) -> None:
        self._repo = repo

    async def create_risk_score(self, data: RiskScoreCreate) -> RiskScore:
        risk_score = RiskScore(
            api_run_id=data.api_run_id,
            calculated_score=data.calculated_score,
            risk_level=data.risk_level,
        )
        return await self._repo.create(risk_score)

    async def get_risk_score(
        self, score_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> RiskScore:
        score = await self._repo.get_by_id(score_id, tenant_id=tenant_id)
        if score is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Risk score {score_id} not found",
            )
        return score

    async def get_risk_for_run(
        self, run_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> RiskScore | None:
        return await self._repo.get_by_run_id(run_id, tenant_id=tenant_id)

    async def get_latest_risk_for_endpoint(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> RiskScore | None:
        return await self._repo.get_latest_by_endpoint(
            endpoint_id, tenant_id=tenant_id
        )
