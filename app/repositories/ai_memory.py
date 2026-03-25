import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.ai_memory import AiMemory


class AiMemoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, memory: AiMemory) -> AiMemory:
        self._session.add(memory)
        await self._session.flush()
        return memory

    async def get_by_fingerprint(
        self, fingerprint: str, endpoint_id: uuid.UUID, limit: int = 5
    ) -> list[AiMemory]:
        result = await self._session.execute(
            select(AiMemory)
            .where(AiMemory.fingerprint == fingerprint, AiMemory.endpoint_id == endpoint_id)
            .order_by(AiMemory.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_fingerprint_org(
        self, fingerprint: str, org_id: uuid.UUID, limit: int = 10
    ) -> list[AiMemory]:
        """Get memories across all endpoints in the org for this fingerprint."""
        result = await self._session.execute(
            select(AiMemory)
            .options(joinedload(AiMemory.endpoint))
            .where(AiMemory.fingerprint == fingerprint, AiMemory.organization_id == org_id)
            .order_by(AiMemory.confidence.desc(), AiMemory.created_at.desc())
            .limit(limit)
        )
        return list(result.unique().scalars().all())

    async def get_by_incident(self, incident_id: uuid.UUID) -> AiMemory | None:
        result = await self._session.execute(
            select(AiMemory).where(AiMemory.incident_id == incident_id)
        )
        return result.scalar_one_or_none()

    async def count_by_org(self, org_id: uuid.UUID) -> int:
        from sqlalchemy import func
        result = await self._session.scalar(
            select(func.count()).where(AiMemory.organization_id == org_id)
        )
        return result or 0
