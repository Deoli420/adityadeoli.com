import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.api_run import ApiRunRepository
from app.repositories.endpoint_sla import EndpointSLARepository
from app.schemas.endpoint_sla import (
    EndpointSLACreate,
    EndpointSLARead,
    EndpointSLAUpdate,
    UptimeStats,
)
from app.services.endpoint_sla import EndpointSLAService

router = APIRouter(prefix="/sla", tags=["sla"])


def _get_service(session: AsyncSession = Depends(get_session)) -> EndpointSLAService:
    return EndpointSLAService(
        repo=EndpointSLARepository(session),
        run_repo=ApiRunRepository(session),
    )


@router.get("/{endpoint_id}", response_model=EndpointSLARead)
async def get_sla(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: EndpointSLAService = Depends(_get_service),
):
    return await service.get_sla(endpoint_id, tenant_id)


@router.get("/{endpoint_id}/uptime", response_model=UptimeStats)
async def get_uptime(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: EndpointSLAService = Depends(_get_service),
):
    return await service.get_uptime(endpoint_id, tenant_id)


@router.post("/", response_model=EndpointSLARead, status_code=201)
async def create_sla(
    data: EndpointSLACreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: EndpointSLAService = Depends(_get_service),
):
    return await service.create_sla(data, tenant_id)


@router.patch("/{endpoint_id}", response_model=EndpointSLARead)
async def update_sla(
    endpoint_id: uuid.UUID,
    data: EndpointSLAUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: EndpointSLAService = Depends(_get_service),
):
    return await service.update_sla(endpoint_id, data, tenant_id)


@router.delete("/{endpoint_id}", status_code=204)
async def delete_sla(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: EndpointSLAService = Depends(_get_service),
):
    await service.delete_sla(endpoint_id, tenant_id)
