"""
Repository for schema snapshots — CRUD + queries for schema drift history.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schema_snapshot import SchemaSnapshot


class SchemaSnapshotRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, snapshot: SchemaSnapshot) -> SchemaSnapshot:
        self._session.add(snapshot)
        await self._session.flush()
        return snapshot

    async def get_latest(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> SchemaSnapshot | None:
        """Return the most recent snapshot for the given endpoint."""
        result = await self._session.execute(
            select(SchemaSnapshot)
            .where(
                SchemaSnapshot.endpoint_id == endpoint_id,
                SchemaSnapshot.organization_id == tenant_id,
            )
            .order_by(SchemaSnapshot.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_history(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID,
        *,
        limit: int = 50,
    ) -> list[SchemaSnapshot]:
        """All snapshots for an endpoint, newest first."""
        result = await self._session.execute(
            select(SchemaSnapshot)
            .where(
                SchemaSnapshot.endpoint_id == endpoint_id,
                SchemaSnapshot.organization_id == tenant_id,
            )
            .order_by(SchemaSnapshot.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id(
        self,
        snapshot_id: uuid.UUID,
        tenant_id: uuid.UUID,
    ) -> SchemaSnapshot | None:
        """Fetch a single snapshot by ID, scoped to tenant."""
        result = await self._session.execute(
            select(SchemaSnapshot).where(
                SchemaSnapshot.id == snapshot_id,
                SchemaSnapshot.organization_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()
