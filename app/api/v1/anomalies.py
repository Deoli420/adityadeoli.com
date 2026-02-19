import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.anomaly import AnomalyRepository
from app.schemas.anomaly import AnomalyCreate, AnomalyRead
from app.services.anomaly import AnomalyService

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


def _get_service(session: AsyncSession = Depends(get_session)) -> AnomalyService:
    return AnomalyService(AnomalyRepository(session))


@router.post("/", response_model=AnomalyRead, status_code=201)
async def create_anomaly(
    data: AnomalyCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AnomalyService = Depends(_get_service),
):
    return await service.create_anomaly(data)


@router.get("/{anomaly_id}", response_model=AnomalyRead)
async def get_anomaly(
    anomaly_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AnomalyService = Depends(_get_service),
):
    return await service.get_anomaly(anomaly_id, tenant_id)


@router.get("/run/{run_id}", response_model=AnomalyRead | None)
async def get_anomaly_for_run(
    run_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AnomalyService = Depends(_get_service),
):
    return await service.get_anomaly_for_run(run_id, tenant_id)


@router.get("/endpoint/{endpoint_id}", response_model=list[AnomalyRead])
async def list_anomalies_for_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=50, ge=1, le=200),
    service: AnomalyService = Depends(_get_service),
):
    return await service.list_anomalies_for_endpoint(endpoint_id, tenant_id, limit=limit)
