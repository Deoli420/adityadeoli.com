import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert_rule import AlertRule


class AlertRuleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, rule: AlertRule) -> AlertRule:
        self._session.add(rule)
        await self._session.flush()
        await self._session.refresh(rule)
        return rule

    async def get_by_id(
        self,
        rule_id: uuid.UUID,
        *,
        tenant_id: Optional[uuid.UUID] = None,
    ) -> Optional[AlertRule]:
        stmt = select(AlertRule).where(AlertRule.id == rule_id)
        if tenant_id is not None:
            stmt = stmt.where(AlertRule.organization_id == tenant_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        *,
        tenant_id: Optional[uuid.UUID] = None,
    ) -> list[AlertRule]:
        stmt = select(AlertRule).where(AlertRule.endpoint_id == endpoint_id)
        if tenant_id is not None:
            stmt = stmt.where(AlertRule.organization_id == tenant_id)
        stmt = stmt.order_by(AlertRule.created_at.desc())
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_rules_for_endpoint(
        self,
        endpoint_id: uuid.UUID,
    ) -> list[AlertRule]:
        """Return all active rules for an endpoint (no tenant filter — used by scheduler)."""
        stmt = (
            select(AlertRule)
            .where(AlertRule.endpoint_id == endpoint_id, AlertRule.is_active.is_(True))
            .order_by(AlertRule.created_at)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, rule: AlertRule) -> AlertRule:
        await self._session.flush()
        await self._session.refresh(rule)
        return rule

    async def delete(self, rule: AlertRule) -> None:
        await self._session.delete(rule)
        await self._session.flush()

    async def increment_consecutive(self, rule: AlertRule) -> None:
        """Increment current_consecutive count by 1."""
        rule.current_consecutive += 1
        await self._session.flush()

    async def reset_consecutive(self, rule: AlertRule) -> None:
        """Reset current_consecutive to 0."""
        rule.current_consecutive = 0
        await self._session.flush()

    async def mark_triggered(self, rule: AlertRule) -> None:
        """Set last_triggered_at to now and reset consecutive counter."""
        rule.last_triggered_at = datetime.now(timezone.utc)
        rule.current_consecutive = 0
        await self._session.flush()
