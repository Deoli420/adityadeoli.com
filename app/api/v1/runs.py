import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.api_run import ApiRunRepository
from app.schemas.api_run import ApiRunCreate, ApiRunRead, ApiRunSummary
from app.services.api_run import ApiRunService

router = APIRouter(prefix="/runs", tags=["runs"])


def _get_service(session: AsyncSession = Depends(get_session)) -> ApiRunService:
    return ApiRunService(ApiRunRepository(session))


@router.post("/", response_model=ApiRunRead, status_code=201)
async def create_run(
    data: ApiRunCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiRunService = Depends(_get_service),
):
    return await service.create_run(data, tenant_id)


@router.get("/{run_id}", response_model=ApiRunRead)
async def get_run(
    run_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiRunService = Depends(_get_service),
):
    return await service.get_run(run_id, tenant_id)


@router.get("/endpoint/{endpoint_id}", response_model=list[ApiRunSummary])
async def list_runs_for_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=50, ge=1, le=200),
    service: ApiRunService = Depends(_get_service),
):
    return await service.list_runs_for_endpoint(endpoint_id, tenant_id, limit=limit)


@router.get("/endpoint/{endpoint_id}/failure-rate")
async def get_failure_rate(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiRunService = Depends(_get_service),
):
    rate = await service.get_failure_rate(endpoint_id, tenant_id)
    return {"endpoint_id": str(endpoint_id), "failure_rate_percent": rate}
