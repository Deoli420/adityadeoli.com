# Incident Fingerprinting Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute a deterministic fingerprint for every incident based on its signal combination, match new incidents against historical patterns (fuzzy + cross-endpoint), and surface similar incidents with resolution history in the UI.

**Architecture:** New `FingerprintService` computes SHA-256 hashes of signal flags + severity band + error category. A `incident_fingerprint_cache` table materializes match statistics. The service is called from `_manage_incidents()` in the scheduler jobs and from the incident resolution flow. Frontend gets a PatternMatchCard on incident detail and recurrence badges on the list.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy 2 async, Alembic, PostgreSQL 16, React 19, TypeScript, React Query v5

**Spec:** `docs/superpowers/specs/2026-03-24-incident-fingerprinting-design.md`

---

## Task 1: Database — Migration, Models

**Files:**
- Create: `app/models/fingerprint_cache.py`
- Modify: `app/models/incident.py`
- Create: `alembic/versions/012_add_incident_fingerprinting.py`

- [ ] **Step 1: Add fingerprint column to Incident model**

In `app/models/incident.py`, add after the `auto_resolve_after` column (line 73):

```python
fingerprint: Mapped[Optional[str]] = mapped_column(
    String(64), nullable=True, index=True
)
```

Add `String` to the existing sqlalchemy imports if not already there (it is — line 6).

- [ ] **Step 2: Create IncidentFingerprintCache model**

Create `app/models/fingerprint_cache.py`:

```python
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IncidentFingerprintCache(Base):
    __tablename__ = "incident_fingerprint_cache"
    __table_args__ = (
        UniqueConstraint("fingerprint", "endpoint_id", name="uq_fingerprint_endpoint"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    endpoint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_endpoints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    signal_flags: Mapped[list] = mapped_column(JSON, nullable=False)
    occurrence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    avg_resolution_ms: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    last_resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    endpoint = relationship("ApiEndpoint")
    organization = relationship("Organization")
```

- [ ] **Step 3: Create Alembic migration**

Create `alembic/versions/012_add_incident_fingerprinting.py`. Read an existing migration (e.g., `011_add_invites_and_owner_role.py`) to match the format — use `revision`, `down_revision`, `depends_on` pattern. The migration must:

1. Add `fingerprint VARCHAR(64)` column to `incidents` table (nullable, with index)
2. Create `incident_fingerprint_cache` table with all columns from the model
3. Add unique constraint `uq_fingerprint_endpoint` on `(fingerprint, endpoint_id)`

Use `op.add_column`, `op.create_table`, `op.create_index`. The `down_revision` should be the revision ID from `011_add_invites_and_owner_role.py` — read that file to get the exact revision string.

- [ ] **Step 4: Verify migration**

```bash
cd /Users/adityadeoli/SentinelAI && alembic upgrade head
```

If running locally without a DB, at minimum verify the migration file is syntactically valid:
```bash
python -c "import alembic.versions" 2>&1 || echo "OK - import check"
```

- [ ] **Step 5: Commit**

```bash
git add app/models/incident.py app/models/fingerprint_cache.py alembic/versions/012_add_incident_fingerprinting.py
git commit -m "feat: add fingerprint column to incidents and fingerprint cache table (migration 012)"
```

---

## Task 2: Backend — FingerprintService + Repository

**Files:**
- Create: `app/services/fingerprint.py`
- Create: `app/repositories/fingerprint.py`

- [ ] **Step 1: Create fingerprint repository**

Create `app/repositories/fingerprint.py`:

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fingerprint_cache import IncidentFingerprintCache
from app.models.incident import Incident


class FingerprintRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_cache_entry(
        self, fingerprint: str, endpoint_id: uuid.UUID
    ) -> IncidentFingerprintCache | None:
        result = await self._session.execute(
            select(IncidentFingerprintCache).where(
                IncidentFingerprintCache.fingerprint == fingerprint,
                IncidentFingerprintCache.endpoint_id == endpoint_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_cross_endpoint_matches(
        self, fingerprint: str, org_id: uuid.UUID, exclude_endpoint_id: uuid.UUID
    ) -> list[IncidentFingerprintCache]:
        result = await self._session.execute(
            select(IncidentFingerprintCache)
            .where(
                IncidentFingerprintCache.fingerprint == fingerprint,
                IncidentFingerprintCache.organization_id == org_id,
                IncidentFingerprintCache.endpoint_id != exclude_endpoint_id,
            )
        )
        return list(result.scalars().all())

    async def get_recent_resolved_with_fingerprints(
        self, endpoint_id: uuid.UUID, limit: int = 20
    ) -> list[Incident]:
        result = await self._session.execute(
            select(Incident)
            .where(
                Incident.endpoint_id == endpoint_id,
                Incident.status == "RESOLVED",
                Incident.fingerprint.is_not(None),
            )
            .order_by(Incident.resolved_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def upsert_cache(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
        org_id: uuid.UUID,
        signal_flags: list[str],
    ) -> IncidentFingerprintCache:
        existing = await self.get_cache_entry(fingerprint, endpoint_id)
        now = datetime.now(timezone.utc)

        if existing:
            existing.occurrence_count += 1
            existing.last_seen_at = now
            existing.signal_flags = signal_flags
            await self._session.flush()
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
        return entry

    async def update_cache_on_resolve(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
        resolution_ms: int,
        notes: str | None,
    ) -> None:
        entry = await self.get_cache_entry(fingerprint, endpoint_id)
        if entry is None:
            return

        # Running average
        if entry.avg_resolution_ms is None:
            entry.avg_resolution_ms = resolution_ms
        else:
            count = entry.occurrence_count or 1
            entry.avg_resolution_ms = int(
                (entry.avg_resolution_ms * (count - 1) + resolution_ms) / count
            )

        if notes:
            entry.last_resolution_notes = notes[:500]

        await self._session.flush()
```

- [ ] **Step 2: Create fingerprint service**

Create `app/services/fingerprint.py`:

```python
import hashlib
import uuid
from dataclasses import dataclass

from app.models.incident import Incident
from app.repositories.fingerprint import FingerprintRepository


@dataclass
class MatchResult:
    fingerprint: str
    signal_flags: list[str]
    exact_match: dict | None  # {occurrence_count, avg_resolution_ms, last_resolution_notes}
    fuzzy_matches: list[dict]  # [{incident_id, title, similarity, resolved_at}]
    cross_endpoint_matches: list[dict]  # [{endpoint_name, occurrence_count}]


class FingerprintService:

    @staticmethod
    def compute_signal_flags(pipeline) -> list[str]:
        """Extract active signal flags from a PipelineResult."""
        flags = []

        # Status mismatch
        if not pipeline.run.is_success:
            flags.append("status_mismatch")

        # Latency spike
        if (
            pipeline.performance
            and hasattr(pipeline.performance, "deviation_percent")
            and pipeline.performance.deviation_percent is not None
            and pipeline.performance.deviation_percent > 50
        ):
            flags.append("latency_spike")

        # Schema drift
        if pipeline.schema_drift and pipeline.schema_drift.has_drift:
            flags.append("schema_drift")

        # Security finding
        if (
            pipeline.security_scan
            and hasattr(pipeline.security_scan, "findings")
            and len(pipeline.security_scan.findings) > 0
        ):
            flags.append("security_finding")

        # Contract violation
        if (
            pipeline.contract
            and hasattr(pipeline.contract, "has_violations")
            and pipeline.contract.has_violations
        ):
            flags.append("contract_violation")

        # AI anomaly
        if pipeline.anomaly and pipeline.anomaly.anomaly_detected:
            flags.append("ai_anomaly")

        return sorted(flags)

    @staticmethod
    def get_severity_band(pipeline) -> str:
        """Get risk level from pipeline result."""
        if pipeline.risk:
            return pipeline.risk.risk_level
        return "LOW"

    @staticmethod
    def get_error_category(status_code: int | None) -> str:
        """Bucket status code into category."""
        if status_code is None:
            return "connection_error"
        if status_code == 0:
            return "timeout"
        if 200 <= status_code < 400:
            return "ok"
        if 400 <= status_code < 500:
            return "4xx"
        if 500 <= status_code < 600:
            return "5xx"
        return "unknown"

    @staticmethod
    def compute_fingerprint(signals: list[str], severity_band: str, error_category: str) -> str:
        """SHA-256 hash of canonical signal string."""
        canonical = "|".join(sorted(signals)) + "|" + severity_band + "|" + error_category
        return hashlib.sha256(canonical.encode()).hexdigest()

    @staticmethod
    def compute_from_pipeline(pipeline) -> tuple[str, list[str]]:
        """Compute fingerprint and signal flags from a PipelineResult."""
        flags = FingerprintService.compute_signal_flags(pipeline)
        severity = FingerprintService.get_severity_band(pipeline)
        error_cat = FingerprintService.get_error_category(pipeline.run.status_code)
        fp = FingerprintService.compute_fingerprint(flags, severity, error_cat)
        return fp, flags

    @staticmethod
    def jaccard_similarity(a: set[str], b: set[str]) -> float:
        if not a and not b:
            return 0.0
        intersection = a & b
        union = a | b
        return len(intersection) / len(union)

    async def find_matches(
        self,
        repo: FingerprintRepository,
        fingerprint: str,
        signal_flags: list[str],
        endpoint_id: uuid.UUID,
        org_id: uuid.UUID,
    ) -> MatchResult:
        # 1. Exact match on same endpoint
        exact_entry = await repo.get_cache_entry(fingerprint, endpoint_id)
        exact_match = None
        if exact_entry and exact_entry.occurrence_count > 0:
            exact_match = {
                "occurrence_count": exact_entry.occurrence_count,
                "avg_resolution_ms": exact_entry.avg_resolution_ms,
                "last_resolution_notes": exact_entry.last_resolution_notes,
            }

        # 2. Fuzzy match on same endpoint (Jaccard >= 0.6)
        fuzzy_matches = []
        recent_resolved = await repo.get_recent_resolved_with_fingerprints(endpoint_id, limit=20)
        current_set = set(signal_flags)

        for inc in recent_resolved:
            # Get signal flags from cache for this incident's fingerprint
            inc_cache = await repo.get_cache_entry(inc.fingerprint, endpoint_id)
            if inc_cache is None:
                continue
            inc_signals = set(inc_cache.signal_flags or [])
            similarity = self.jaccard_similarity(current_set, inc_signals)
            if similarity >= 0.6 and inc.fingerprint != fingerprint:
                fuzzy_matches.append({
                    "incident_id": str(inc.id),
                    "title": inc.title[:200] if inc.title else "",
                    "similarity": round(similarity, 2),
                    "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
                })

        # Deduplicate fuzzy matches by incident_id, keep highest similarity
        seen = {}
        for m in fuzzy_matches:
            iid = m["incident_id"]
            if iid not in seen or m["similarity"] > seen[iid]["similarity"]:
                seen[iid] = m
        fuzzy_matches = sorted(seen.values(), key=lambda x: x["similarity"], reverse=True)[:5]

        # 3. Cross-endpoint match
        cross_entries = await repo.get_cross_endpoint_matches(fingerprint, org_id, endpoint_id)
        cross_endpoint_matches = []
        for entry in cross_entries:
            ep_name = entry.endpoint.name if entry.endpoint else str(entry.endpoint_id)
            cross_endpoint_matches.append({
                "endpoint_name": ep_name,
                "occurrence_count": entry.occurrence_count,
            })

        return MatchResult(
            fingerprint=fingerprint,
            signal_flags=signal_flags,
            exact_match=exact_match,
            fuzzy_matches=fuzzy_matches,
            cross_endpoint_matches=cross_endpoint_matches,
        )
```

- [ ] **Step 3: Commit**

```bash
git add app/services/fingerprint.py app/repositories/fingerprint.py
git commit -m "feat: add FingerprintService and FingerprintRepository"
```

---

## Task 3: Backend — Pipeline Integration + API Changes

**Files:**
- Modify: `app/scheduler/jobs.py` — call fingerprint on incident create
- Modify: `app/services/incident.py` — accept fingerprint param, update cache on resolve
- Modify: `app/api/v1/incidents.py` — add /similar endpoint, include pattern_match in response
- Modify: `app/schemas/incident.py` — add fingerprint and pattern_match fields

- [ ] **Step 1: Update `_manage_incidents` in jobs.py**

In `app/scheduler/jobs.py`, modify the `_manage_incidents` function. After the incident is auto-created (around line 202), add fingerprint computation:

```python
async def _manage_incidents(eid: uuid.UUID, pipeline) -> None:
    from app.repositories.fingerprint import FingerprintRepository
    from app.repositories.incident import IncidentRepository
    from app.services.fingerprint import FingerprintService
    from app.services.incident import IncidentService

    async with async_session_factory() as session:
        svc = IncidentService(IncidentRepository(session))
        fp_repo = FingerprintRepository(session)
        fp_service = FingerprintService()

        # Auto-create from anomaly
        if pipeline.anomaly and pipeline.anomaly.anomaly_detected:
            # Compute fingerprint BEFORE creating incident
            fingerprint, signal_flags = FingerprintService.compute_from_pipeline(pipeline)

            incident = await svc.auto_create_from_anomaly(
                endpoint_id=eid,
                organization_id=pipeline.run.organization_id,
                run_id=pipeline.run.id,
                reasoning=pipeline.anomaly.reasoning,
                severity_score=(
                    pipeline.risk.calculated_score if pipeline.risk else 0.5
                ),
                fingerprint=fingerprint,  # NEW param
            )
            if incident:
                # Find matches and store as event
                matches = await fp_service.find_matches(
                    fp_repo, fingerprint, signal_flags, eid, pipeline.run.organization_id
                )
                await fp_repo.upsert_cache(
                    fingerprint, eid, pipeline.run.organization_id, signal_flags
                )

                # Store match info as incident event
                from app.models.incident import IncidentEvent
                match_detail = {
                    "type": "fingerprint_match",
                    "fingerprint": fingerprint,
                    "signal_flags": signal_flags,
                }
                if matches.exact_match:
                    match_detail["exact_match"] = matches.exact_match
                if matches.fuzzy_matches:
                    match_detail["fuzzy_matches"] = matches.fuzzy_matches
                if matches.cross_endpoint_matches:
                    match_detail["cross_endpoint_matches"] = matches.cross_endpoint_matches

                session.add(IncidentEvent(
                    incident_id=incident.id,
                    event_type="fingerprint_match",
                    detail=match_detail,
                ))

                logger.info(
                    "Auto-created incident %s for %s (severity=%s, fingerprint=%s, matches=%d)",
                    incident.id, pipeline.endpoint_name, incident.severity,
                    fingerprint[:12], len(matches.fuzzy_matches) + (1 if matches.exact_match else 0),
                )

        # Auto-resolve on consecutive successes (existing logic unchanged)
        if pipeline.run.is_success:
            consecutive = await _count_consecutive_successes(session, eid)
            resolved = await svc.check_auto_resolve(eid, consecutive)
            if resolved:
                logger.info(
                    "Auto-resolved incident %s for %s after %d successes",
                    resolved.id, pipeline.endpoint_name, consecutive,
                )

        await session.commit()
```

- [ ] **Step 2: Update `auto_create_from_anomaly` to accept fingerprint**

In `app/services/incident.py`, modify `auto_create_from_anomaly` (line 164) to accept and set fingerprint:

Add `fingerprint: str | None = None` to the parameter list. Then after creating the Incident object (line 190), add:
```python
incident = Incident(
    endpoint_id=endpoint_id,
    organization_id=organization_id,
    title=title,
    severity=severity,
    trigger_type="anomaly",
    trigger_run_id=run_id,
    fingerprint=fingerprint,  # NEW
)
```

- [ ] **Step 3: Update `update_status` to update fingerprint cache on resolution**

In `app/services/incident.py`, modify `update_status` (around line 117-118 where `RESOLVED` is handled):

```python
elif data.status == "RESOLVED":
    incident.resolved_at = now

    # Update fingerprint cache with resolution data
    if incident.fingerprint:
        from app.repositories.fingerprint import FingerprintRepository
        fp_repo = FingerprintRepository(self._repo._session)
        resolution_ms = int((now - incident.started_at).total_seconds() * 1000)
        await fp_repo.update_cache_on_resolve(
            incident.fingerprint,
            incident.endpoint_id,
            resolution_ms,
            incident.notes,
        )
```

- [ ] **Step 4: Update incident schemas**

In `app/schemas/incident.py`, add to the incident response schemas:

```python
# Add to the Pydantic response model for single incident detail
class PatternMatch(BaseModel):
    is_known_pattern: bool = False
    occurrence_count: int = 0
    avg_resolution_time: str | None = None
    last_resolution_notes: str | None = None
    similar_incidents: list[dict] = []
    cross_endpoint_matches: list[dict] = []
```

Add `fingerprint: str | None = None` and `pattern_match: PatternMatch | None = None` to the incident detail response schema.

- [ ] **Step 5: Add `/incidents/{id}/similar` endpoint**

In `app/api/v1/incidents.py`, add a new endpoint:

```python
@router.get("/{incident_id}/similar")
async def get_similar_incidents(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Get similar historical incidents based on fingerprint matching."""
    from app.repositories.fingerprint import FingerprintRepository
    from app.services.fingerprint import FingerprintService

    repo = IncidentRepository(session)
    svc = IncidentService(repo)
    incident = await svc.get_incident(incident_id, tenant_id)

    if not incident.fingerprint:
        return {"similar": [], "cross_endpoint": []}

    fp_repo = FingerprintRepository(session)
    fp_service = FingerprintService()

    # Get signal flags from cache
    cache_entry = await fp_repo.get_cache_entry(incident.fingerprint, incident.endpoint_id)
    signal_flags = cache_entry.signal_flags if cache_entry else []

    matches = await fp_service.find_matches(
        fp_repo, incident.fingerprint, signal_flags,
        incident.endpoint_id, tenant_id,
    )

    return {
        "fingerprint": incident.fingerprint,
        "signal_flags": signal_flags,
        "exact_match": matches.exact_match,
        "fuzzy_matches": matches.fuzzy_matches,
        "cross_endpoint_matches": matches.cross_endpoint_matches,
    }
```

- [ ] **Step 6: Verify backend starts**

```bash
cd /Users/adityadeoli/SentinelAI && python -c "from app.services.fingerprint import FingerprintService; print('OK')"
```

- [ ] **Step 7: Commit**

```bash
git add app/scheduler/jobs.py app/services/incident.py app/api/v1/incidents.py app/schemas/incident.py
git commit -m "feat: integrate fingerprinting into pipeline, incidents API, and resolution flow"
```

---

## Task 4: Frontend — PatternMatchCard + Recurrence Badge

**Files:**
- Create: `frontend/src/components/incidents/PatternMatchCard.tsx`
- Create: `frontend/src/hooks/useIncidentSimilar.ts`
- Modify: `frontend/src/services/endpointsService.ts` — add getIncidentSimilar()
- Modify: `frontend/src/pages/IncidentDetailPage.tsx` — add PatternMatchCard
- Modify: `frontend/src/pages/IncidentsPage.tsx` — add recurrence badge

- [ ] **Step 1: Add API function**

In `frontend/src/services/endpointsService.ts`, add:

```typescript
export interface IncidentSimilarResponse {
  fingerprint: string | null;
  signal_flags: string[];
  exact_match: {
    occurrence_count: number;
    avg_resolution_ms: number | null;
    last_resolution_notes: string | null;
  } | null;
  fuzzy_matches: {
    incident_id: string;
    title: string;
    similarity: number;
    resolved_at: string | null;
  }[];
  cross_endpoint_matches: {
    endpoint_name: string;
    occurrence_count: number;
  }[];
}

export async function getIncidentSimilar(id: string): Promise<IncidentSimilarResponse> {
  const { data } = await apiClient.get<IncidentSimilarResponse>(
    `${API}/incidents/${id}/similar`,
  );
  return data;
}
```

- [ ] **Step 2: Create hook**

Create `frontend/src/hooks/useIncidentSimilar.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { getIncidentSimilar } from "@/services/endpointsService.ts";

export function useIncidentSimilar(incidentId: string) {
  return useQuery({
    queryKey: ["incident-similar", incidentId],
    queryFn: () => getIncidentSimilar(incidentId),
    enabled: !!incidentId,
    staleTime: 5 * 60 * 1000, // 5 min — fingerprint data doesn't change often
  });
}
```

- [ ] **Step 3: Create PatternMatchCard component**

Create `frontend/src/components/incidents/PatternMatchCard.tsx`. This component:
- Takes `incidentId: string` as prop
- Calls `useIncidentSimilar(incidentId)`
- Shows nothing if no matches
- **Known Pattern** section (when exact_match exists): "Known Pattern — Seen N times", avg resolution badge, last resolution notes
- **Similar Incidents** section (when fuzzy_matches exist): collapsible list with title, similarity %, date
- **Cross-Endpoint** section (when cross_endpoint_matches exist): "Also seen on N other endpoints" with expandable list
- Uses existing design tokens (card, text-text-primary, text-text-secondary, border-border)
- Uses Lucide icons: History, GitCompareArrows, Globe
- Uses `formatDuration` from `@/utils/formatters.ts` for resolution time
- Uses Link from react-router-dom for incident links

- [ ] **Step 4: Add PatternMatchCard to IncidentDetailPage**

Read `frontend/src/pages/IncidentDetailPage.tsx` first. Add the PatternMatchCard after the incident header/metadata section and before the timeline. Import and render:

```tsx
import { PatternMatchCard } from "@/components/incidents/PatternMatchCard.tsx";

// In the JSX, after the incident header section:
<PatternMatchCard incidentId={id} />
```

- [ ] **Step 5: Add recurrence badge to IncidentsPage**

Read `frontend/src/pages/IncidentsPage.tsx`. In the IncidentRow component, after the severity badge, add a recurrence indicator. This requires knowing the occurrence count — we can get it from the incident timeline events (the `fingerprint_match` event contains `exact_match.occurrence_count`).

Simpler approach: add `fingerprint` to the `IncidentListItem` type and response. Then on the incidents list, show a small badge "Seen Nx" when an incident has a fingerprint that appears in the cache.

For now, a lightweight approach: if the incident has a fingerprint, show a subtle `Fingerprint` icon (lucide) as a visual indicator that pattern data is available. Full occurrence count shows on detail page.

- [ ] **Step 6: Build and verify**

```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/incidents/PatternMatchCard.tsx frontend/src/hooks/useIncidentSimilar.ts frontend/src/services/endpointsService.ts frontend/src/pages/IncidentDetailPage.tsx frontend/src/pages/IncidentsPage.tsx
git commit -m "feat: add PatternMatchCard, recurrence indicators, and incident similar API hook"
```

---

## Task 5: Deploy to Production

- [ ] **Step 1: Push all commits**
```bash
git push origin main
```

- [ ] **Step 2: Pull on server and run migration**
```bash
ssh root@64.227.143.70 "cd /home/deploy/sentinelai && git pull origin main && docker compose exec api alembic upgrade head"
```

- [ ] **Step 3: Build and deploy frontend**
```bash
cd /Users/adityadeoli/SentinelAI/frontend && npm run build
rsync -avz --delete frontend/dist/ root@64.227.143.70:/home/deploy/sentinelai/frontend/dist/
```

- [ ] **Step 4: Rebuild API container and restart**
```bash
ssh root@64.227.143.70 "cd /home/deploy/sentinelai && docker compose build api && docker compose up -d api && docker compose restart nginx"
```

- [ ] **Step 5: Verify production**
```bash
curl -s https://sentinelai.adityadeoli.com/api/v1/health | head -1
curl -s -o /dev/null -w "%{http_code}" https://sentinelai.adityadeoli.com/
```
