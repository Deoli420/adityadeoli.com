import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.fingerprint_cache import IncidentFingerprintCache
from app.models.incident import Incident


class FingerprintRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_cache_entry(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
    ) -> Optional[IncidentFingerprintCache]:
        """Return the cache entry for a fingerprint+endpoint pair, or None."""
        stmt = select(IncidentFingerprintCache).where(
            IncidentFingerprintCache.fingerprint == fingerprint,
            IncidentFingerprintCache.endpoint_id == endpoint_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_cross_endpoint_matches(
        self,
        fingerprint: str,
        org_id: uuid.UUID,
        exclude_endpoint_id: uuid.UUID,
    ) -> list[IncidentFingerprintCache]:
        """Return cache entries with the same fingerprint on OTHER endpoints in the org."""
        stmt = (
            select(IncidentFingerprintCache)
            .options(joinedload(IncidentFingerprintCache.endpoint))
            .where(
                IncidentFingerprintCache.fingerprint == fingerprint,
                IncidentFingerprintCache.organization_id == org_id,
                IncidentFingerprintCache.endpoint_id != exclude_endpoint_id,
            )
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_recent_resolved_with_fingerprints(
        self,
        endpoint_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Incident]:
        """Return recently resolved incidents that have a fingerprint, for fuzzy matching."""
        stmt = (
            select(Incident)
            .where(
                Incident.endpoint_id == endpoint_id,
                Incident.status == "RESOLVED",
                Incident.fingerprint.isnot(None),
            )
            .order_by(Incident.resolved_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def upsert_cache(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
        org_id: uuid.UUID,
        signal_flags: list[str],
    ) -> IncidentFingerprintCache:
        """Create a new cache entry or increment occurrence_count on an existing one."""
        existing = await self.get_cache_entry(fingerprint, endpoint_id)
        now = datetime.now(timezone.utc)

        if existing is not None:
            existing.occurrence_count += 1
            existing.last_seen_at = now
            existing.signal_flags = signal_flags
            await self._session.flush()
            await self._session.refresh(existing)
            return existing

        entry = IncidentFingerprintCache(
            fingerprint=fingerprint,
            endpoint_id=endpoint_id,
            organization_id=org_id,
            signal_flags=signal_flags,
            occurrence_count=1,
            last_seen_at=now,
            first_seen_at=now,
        )
        self._session.add(entry)
        await self._session.flush()
        await self._session.refresh(entry)
        return entry

    async def update_cache_on_resolve(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
        resolution_ms: int,
        notes: str | None,
    ) -> None:
        """Update avg_resolution_ms (running average) and last_resolution_notes."""
        entry = await self.get_cache_entry(fingerprint, endpoint_id)
        if entry is None:
            return

        # Running average: new_avg = old_avg + (new_val - old_avg) / count
        if entry.avg_resolution_ms is None:
            entry.avg_resolution_ms = resolution_ms
        else:
            count = entry.occurrence_count or 1
            entry.avg_resolution_ms = int(
                entry.avg_resolution_ms + (resolution_ms - entry.avg_resolution_ms) / count
            )

        if notes:
            entry.last_resolution_notes = notes

        await self._session.flush()
