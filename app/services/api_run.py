import uuid

from fastapi import HTTPException, status

from app.models.api_run import ApiRun
from app.repositories.api_run import ApiRunRepository
from app.schemas.api_run import ApiRunCreate


class ApiRunService:
    def __init__(self, repo: ApiRunRepository) -> None:
        self._repo = repo

    async def create_run(
        self, data: ApiRunCreate, tenant_id: uuid.UUID
    ) -> ApiRun:
        run = ApiRun(
            endpoint_id=data.endpoint_id,
            organization_id=tenant_id,
            status_code=data.status_code,
            response_time_ms=data.response_time_ms,
            response_body=data.response_body,
            is_success=data.is_success,
            error_message=data.error_message,
        )
        return await self._repo.create(run)

    async def get_run(
        self, run_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> ApiRun:
        run = await self._repo.get_by_id(run_id, tenant_id)
        if run is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API run {run_id} not found",
            )
        return run

    async def list_runs_for_endpoint(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID | None = None,
        *,
        limit: int = 50,
    ) -> list[ApiRun]:
        return await self._repo.get_by_endpoint(
            endpoint_id, tenant_id=tenant_id, limit=limit
        )

    async def get_failure_rate(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> float:
        return await self._repo.get_failure_rate(
            endpoint_id, tenant_id=tenant_id
        )

    async def get_recent_response_times(
        self, endpoint_id: uuid.UUID, *, limit: int = 20
    ) -> list[float]:
        return await self._repo.get_recent_times(endpoint_id, limit=limit)
