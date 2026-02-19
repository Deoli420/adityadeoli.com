import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.risk_score import RiskScoreRepository
from app.schemas.risk_score import RiskScoreCreate, RiskScoreRead
from app.services.risk_score import RiskScoreService

router = APIRouter(prefix="/risk-scores", tags=["risk-scores"])


def _get_service(session: AsyncSession = Depends(get_session)) -> RiskScoreService:
    return RiskScoreService(RiskScoreRepository(session))


@router.post("/", response_model=RiskScoreRead, status_code=201)
async def create_risk_score(
    data: RiskScoreCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: RiskScoreService = Depends(_get_service),
):
    return await service.create_risk_score(data)


@router.get("/{score_id}", response_model=RiskScoreRead)
async def get_risk_score(
    score_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: RiskScoreService = Depends(_get_service),
):
    return await service.get_risk_score(score_id, tenant_id)


@router.get("/run/{run_id}", response_model=RiskScoreRead | None)
async def get_risk_for_run(
    run_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: RiskScoreService = Depends(_get_service),
):
    return await service.get_risk_for_run(run_id, tenant_id)


@router.get("/endpoint/{endpoint_id}/latest", response_model=RiskScoreRead | None)
async def get_latest_risk_for_endpoint(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: RiskScoreService = Depends(_get_service),
):
    return await service.get_latest_risk_for_endpoint(endpoint_id, tenant_id)
