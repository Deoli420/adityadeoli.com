import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.api_endpoint import ApiEndpointRepository
from app.schemas.api_endpoint import (
    ApiEndpointCreate,
    ApiEndpointRead,
    ApiEndpointUpdate,
)
from app.services.api_endpoint import ApiEndpointService
from app.scheduler.engine import monitor_scheduler

router = APIRouter(prefix="/endpoints", tags=["endpoints"])


def _get_service(session: AsyncSession = Depends(get_session)) -> ApiEndpointService:
    return ApiEndpointService(ApiEndpointRepository(session))


@router.get("/", response_model=list[ApiEndpointRead])
async def list_endpoints(
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiEndpointService = Depends(_get_service),
):
    return await service.list_endpoints(tenant_id)


@router.get("/{endpoint_id}", response_model=ApiEndpointRead)
async def get_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiEndpointService = Depends(_get_service),
):
    return await service.get_endpoint(endpoint_id, tenant_id)


@router.post("/", response_model=ApiEndpointRead, status_code=201)
async def create_endpoint(
    data: ApiEndpointCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiEndpointService = Depends(_get_service),
):
    return await service.create_endpoint(data, tenant_id)


@router.patch("/{endpoint_id}", response_model=ApiEndpointRead)
async def update_endpoint(
    endpoint_id: uuid.UUID,
    data: ApiEndpointUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiEndpointService = Depends(_get_service),
):
    return await service.update_endpoint(endpoint_id, data, tenant_id)


@router.delete("/{endpoint_id}", status_code=204)
async def delete_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: ApiEndpointService = Depends(_get_service),
):
    await service.delete_endpoint(endpoint_id, tenant_id)
    # Remove the scheduler job for this endpoint
    if monitor_scheduler.is_running and monitor_scheduler.scheduler:
        job_id = f"monitor_{endpoint_id}"
        try:
            monitor_scheduler.scheduler.remove_job(job_id)
        except Exception:
            pass  # Job may not exist
