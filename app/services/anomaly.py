import uuid

from fastapi import HTTPException, status

from app.models.anomaly import Anomaly
from app.repositories.anomaly import AnomalyRepository
from app.schemas.anomaly import AnomalyCreate


class AnomalyService:
    def __init__(self, repo: AnomalyRepository) -> None:
        self._repo = repo

    async def create_anomaly(self, data: AnomalyCreate) -> Anomaly:
        anomaly = Anomaly(
            api_run_id=data.api_run_id,
            anomaly_detected=data.anomaly_detected,
            severity_score=data.severity_score,
            reasoning=data.reasoning,
            probable_cause=data.probable_cause,
        )
        return await self._repo.create(anomaly)

    async def get_anomaly(
        self, anomaly_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> Anomaly:
        anomaly = await self._repo.get_by_id(anomaly_id, tenant_id=tenant_id)
        if anomaly is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Anomaly {anomaly_id} not found",
            )
        return anomaly

    async def get_anomaly_for_run(
        self, run_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> Anomaly | None:
        return await self._repo.get_by_run_id(run_id, tenant_id=tenant_id)

    async def list_anomalies_for_endpoint(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
        *,
        limit: int = 50,
    ) -> list[Anomaly]:
        return await self._repo.get_by_endpoint(
            endpoint_id, tenant_id=tenant_id, limit=limit
        )
