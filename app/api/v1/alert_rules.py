import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.alert_rule import AlertRuleRepository
from app.schemas.alert_rule import AlertRuleCreate, AlertRuleRead, AlertRuleUpdate
from app.services.alert_rule import AlertRuleService

router = APIRouter(prefix="/alert-rules", tags=["alert-rules"])


def _get_service(session: AsyncSession = Depends(get_session)) -> AlertRuleService:
    return AlertRuleService(repo=AlertRuleRepository(session))


@router.get("/endpoint/{endpoint_id}", response_model=list[AlertRuleRead])
async def list_rules(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    return await service.list_rules(endpoint_id, tenant_id)


@router.get("/{rule_id}", response_model=AlertRuleRead)
async def get_rule(
    rule_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    return await service.get_rule(rule_id, tenant_id)


@router.post("/", response_model=AlertRuleRead, status_code=201)
async def create_rule(
    data: AlertRuleCreate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    return await service.create_rule(data, tenant_id)


@router.patch("/{rule_id}", response_model=AlertRuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    data: AlertRuleUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    return await service.update_rule(rule_id, data, tenant_id)


@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    await service.delete_rule(rule_id, tenant_id)


@router.post("/{rule_id}/toggle", response_model=AlertRuleRead)
async def toggle_rule(
    rule_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: AlertRuleService = Depends(_get_service),
):
    return await service.toggle_rule(rule_id, tenant_id)
