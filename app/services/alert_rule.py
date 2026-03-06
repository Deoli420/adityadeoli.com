import uuid

from fastapi import HTTPException, status

from app.models.alert_rule import AlertRule, ConditionType
from app.repositories.alert_rule import AlertRuleRepository
from app.schemas.alert_rule import AlertRuleCreate, AlertRuleUpdate


class AlertRuleService:
    def __init__(self, repo: AlertRuleRepository) -> None:
        self._repo = repo

    async def create_rule(
        self, data: AlertRuleCreate, tenant_id: uuid.UUID
    ) -> AlertRule:
        # Validate condition_type is a known value
        try:
            ConditionType(data.condition_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown condition_type: {data.condition_type}",
            )

        rule = AlertRule(
            endpoint_id=data.endpoint_id,
            organization_id=tenant_id,
            name=data.name,
            condition_type=data.condition_type,
            threshold=data.threshold,
            consecutive_count=data.consecutive_count,
        )
        return await self._repo.create(rule)

    async def get_rule(
        self, rule_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> AlertRule:
        rule = await self._repo.get_by_id(rule_id, tenant_id=tenant_id)
        if rule is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert rule {rule_id} not found",
            )
        return rule

    async def list_rules(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> list[AlertRule]:
        return await self._repo.get_by_endpoint(endpoint_id, tenant_id=tenant_id)

    async def update_rule(
        self,
        rule_id: uuid.UUID,
        data: AlertRuleUpdate,
        tenant_id: uuid.UUID,
    ) -> AlertRule:
        rule = await self.get_rule(rule_id, tenant_id)

        if data.name is not None:
            rule.name = data.name
        if data.condition_type is not None:
            try:
                ConditionType(data.condition_type)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown condition_type: {data.condition_type}",
                )
            rule.condition_type = data.condition_type
        if data.threshold is not None:
            rule.threshold = data.threshold
        if data.consecutive_count is not None:
            rule.consecutive_count = data.consecutive_count
        if data.is_active is not None:
            rule.is_active = data.is_active

        return await self._repo.update(rule)

    async def delete_rule(
        self, rule_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        rule = await self.get_rule(rule_id, tenant_id)
        await self._repo.delete(rule)

    async def toggle_rule(
        self, rule_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> AlertRule:
        rule = await self.get_rule(rule_id, tenant_id)
        rule.is_active = not rule.is_active
        return await self._repo.update(rule)
