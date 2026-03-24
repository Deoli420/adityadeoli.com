# Incident Fingerprinting — Design Spec

## Problem

Every incident in SentinelAI starts from zero context. When the same endpoint fails the same way for the fifth time, the developer sees a fresh incident card with no memory of past occurrences or resolutions. There is no pattern detection, no recurrence tracking, and no institutional memory. The developer solves the same problem from scratch every time.

## Goals

1. Compute a deterministic fingerprint for every incident based on its signal combination
2. Match new incidents against historical patterns (fuzzy match on same endpoint, exact cross-endpoint)
3. Surface similar incidents with resolution history so developers know what worked before
4. Build the foundation that P2 (Narrative Engine), P4 (AI Memory), and P9 (Triage Queue) depend on

## Non-Goals

- Full-text similarity on anomaly reasoning (that's P4: AI Memory)
- Narrative generation from fingerprint matches (that's P2: Narrative Engine)
- Priority scoring based on recurrence (that's P9: Triage Queue)
- UI redesign of dashboard (separate task)

---

## 1. Fingerprint Computation

### 1.1 Signal Flags

A fingerprint captures which signals fired during the pipeline run that triggered the incident. Six binary flags, derived from the PipelineResult:

| Flag | Source | Condition |
|------|--------|-----------|
| `status_mismatch` | ApiRun | `is_success == False` or `status_code != expected_status` |
| `latency_spike` | PerformanceTracker | `deviation_percent > 50` (existing spike threshold) |
| `schema_drift` | SchemaValidator | `has_drift == True` |
| `security_finding` | CredentialScanner | `len(findings) > 0` |
| `contract_violation` | ContractValidator | `has_violations == True` |
| `ai_anomaly` | AnomalyEngine | `anomaly_detected == True` |

### 1.2 Severity Band

Derived from the risk score's `risk_level`: LOW, MEDIUM, HIGH, CRITICAL.

### 1.3 Error Category

Bucketed from the HTTP status code:

| Status Code | Category |
|-------------|----------|
| 200–399 | `ok` |
| 400–499 | `4xx` |
| 500–599 | `5xx` |
| 0 (timeout) | `timeout` |
| None (connection error) | `connection_error` |

### 1.4 Hash Formula

```python
def compute_fingerprint(signals: list[str], severity_band: str, error_category: str) -> str:
    """
    signals: sorted list of active signal flag names
    severity_band: LOW | MEDIUM | HIGH | CRITICAL
    error_category: ok | 4xx | 5xx | timeout | connection_error
    """
    canonical = "|".join(sorted(signals)) + "|" + severity_band + "|" + error_category
    return hashlib.sha256(canonical.encode()).hexdigest()
```

Example: `SHA256("ai_anomaly|latency_spike|schema_drift|status_mismatch|HIGH|5xx")` → `"a3f8c1..."`

Two incidents with the same signal combination, severity band, and error category produce identical fingerprints — regardless of specific latency values, error messages, or timestamps.

---

## 2. Data Model

### 2.1 Incidents Table Change

Add one column to `incidents`:

```
fingerprint    String(64), nullable, indexed
```

Nullable because existing incidents won't have fingerprints until backfilled.

### 2.2 New Table: `incident_fingerprint_cache`

A materialized summary table to avoid expensive historical queries on every new incident.

```
id                  UUID PK, default uuid4
fingerprint         String(64), NOT NULL, indexed
endpoint_id         UUID FK → api_endpoints, NOT NULL, indexed
organization_id     UUID FK → organizations, NOT NULL, indexed
occurrence_count    Integer, default 1
avg_resolution_ms   BigInteger, nullable
last_resolution_notes Text, nullable
last_seen_at        DateTime(tz), NOT NULL
first_seen_at       DateTime(tz), NOT NULL
created_at          DateTime(tz), server_default now()
```

Unique constraint: `(fingerprint, endpoint_id)` — one cache row per fingerprint per endpoint.

### 2.3 Migration: `012_add_incident_fingerprinting.py`

1. Add `fingerprint` column to `incidents` table
2. Create `incident_fingerprint_cache` table
3. Backfill: compute fingerprints for existing incidents where possible (from linked anomaly + risk score data)

---

## 3. Matching Logic

### 3.1 Exact Match (Same Endpoint)

When a new incident is created with fingerprint `X` on endpoint `Y`:

```sql
SELECT * FROM incident_fingerprint_cache
WHERE fingerprint = :fingerprint AND endpoint_id = :endpoint_id
```

If found: this exact pattern has occurred before on this endpoint. Return occurrence count, avg resolution time, and last resolution notes.

### 3.2 Fuzzy Match (Same Endpoint)

For incidents where no exact fingerprint match exists, compute Jaccard similarity on signal flags against recent resolved incidents on the same endpoint.

```python
def jaccard_similarity(signals_a: set[str], signals_b: set[str]) -> float:
    if not signals_a and not signals_b:
        return 0.0
    intersection = signals_a & signals_b
    union = signals_a | signals_b
    return len(intersection) / len(union)
```

Query: Get the last 20 resolved incidents on this endpoint that have fingerprints. Compute Jaccard similarity. Return matches with similarity >= 0.6 (3 of 5 signals matching).

This runs in application code, not SQL, since we need to decompose fingerprints into signal sets. Performance is fine — 20 hash decompositions is trivial.

**Signal extraction from fingerprint**: Store the signal flags as a separate `signal_flags` JSON column on `incident_fingerprint_cache` to avoid needing to reverse the hash.

Update `incident_fingerprint_cache`:
```
signal_flags    JSON, NOT NULL  -- ["status_mismatch", "latency_spike", "schema_drift"]
```

### 3.3 Cross-Endpoint Match

Secondary signal — shown separately in the UI:

```sql
SELECT ifc.*, ae.name as endpoint_name
FROM incident_fingerprint_cache ifc
JOIN api_endpoints ae ON ifc.endpoint_id = ae.id
WHERE ifc.fingerprint = :fingerprint
  AND ifc.organization_id = :org_id
  AND ifc.endpoint_id != :current_endpoint_id
```

Returns: "This pattern also seen on /api/users (3 times), /api/orders (1 time)."

---

## 4. Pipeline Integration

### 4.1 Fingerprint at Creation

In `app/services/incident.py → auto_create_from_anomaly()` (or `jobs.py → _manage_incidents()`):

After creating the incident:
1. Extract signal flags from `PipelineResult`
2. Get severity band from risk score
3. Get error category from API run status code
4. Compute `fingerprint = compute_fingerprint(signals, severity, error_cat)`
5. Set `incident.fingerprint = fingerprint`
6. Query cache for exact match
7. Query recent resolved incidents for fuzzy matches
8. Store match results in an `IncidentEvent`:
   ```json
   {
     "type": "fingerprint_match",
     "fingerprint": "a3f8c1...",
     "exact_match": {
       "occurrence_count": 4,
       "avg_resolution_ms": 1080000,
       "last_resolution_notes": "Rolled back deployment abc123"
     },
     "fuzzy_matches": [
       {"incident_id": "uuid", "title": "...", "similarity": 0.75, "resolved_at": "..."}
     ],
     "cross_endpoint_matches": [
       {"endpoint_name": "/api/users", "occurrence_count": 2}
     ]
   }
   ```
9. Upsert `incident_fingerprint_cache`: increment count, update last_seen_at

### 4.2 Update on Resolution

When an incident is resolved (via `PATCH /incidents/{id}/status` with status=RESOLVED):
1. Compute resolution time: `resolved_at - started_at`
2. Update cache: set `avg_resolution_ms` (running average), `last_resolution_notes` (from incident notes)

### 4.3 Fingerprint Service

New file: `app/services/fingerprint.py`

```python
class FingerprintService:
    def compute(pipeline_result, risk_score, api_run) -> str
    def find_matches(fingerprint, endpoint_id, org_id) -> MatchResult
    def update_cache_on_create(fingerprint, endpoint_id, org_id, signal_flags)
    def update_cache_on_resolve(fingerprint, endpoint_id, resolution_ms, notes)
```

Clean separation — the service is called from `_manage_incidents()` and from the incident status update endpoint.

---

## 5. API Changes

### 5.1 Incident Response Enhancement

`GET /incidents/{id}` response adds:

```json
{
  "fingerprint": "a3f8c1...",
  "pattern_match": {
    "is_known_pattern": true,
    "occurrence_count": 4,
    "avg_resolution_time": "18m",
    "last_resolution_notes": "Rolled back deployment abc123",
    "similar_incidents": [
      {"id": "...", "title": "...", "similarity": 0.75, "resolved_at": "..."}
    ],
    "cross_endpoint_matches": [
      {"endpoint_name": "/api/users", "count": 2}
    ]
  }
}
```

### 5.2 New Endpoint

```
GET /incidents/{id}/similar
  → Returns detailed list of similar historical incidents with full metadata
  → Includes both exact fingerprint matches and fuzzy signal matches
```

---

## 6. Frontend Changes

### 6.1 IncidentDetailPage — Pattern Match Card

New section between incident header and timeline, only shown when matches exist:

**Known Pattern** (exact match):
- Header: "Known Pattern — Seen N times"
- Avg resolution time badge
- Last resolution notes (truncated, expandable)
- Link to most recent similar incident

**Similar Incidents** (fuzzy matches):
- Collapsible list: title, similarity %, date, resolution time
- Each links to the historical incident

**Cross-Endpoint** (subtle secondary):
- "Also seen on 2 other endpoints" with expandable list

### 6.2 IncidentsPage — Recurrence Badge

On incident cards in the list, show a small badge: "Seen 4x" when `occurrence_count > 1`. Color-coded: 2-3x = muted, 4+ = amber, 10+ = red.

### 6.3 Hooks

New: `useIncidentSimilar(incidentId)` — fetches `/incidents/{id}/similar`

Existing `useIncident(id)` already returns the incident; pattern_match data comes with it.

---

## 7. Files Affected

### Backend (New)
- `app/services/fingerprint.py` — FingerprintService
- `app/models/fingerprint_cache.py` — IncidentFingerprintCache model
- `app/repositories/fingerprint.py` — Cache CRUD
- `alembic/versions/012_add_incident_fingerprinting.py` — Migration

### Backend (Modified)
- `app/models/incident.py` — Add fingerprint column
- `app/services/incident.py` — Call FingerprintService on create
- `app/scheduler/jobs.py` — Pass pipeline signals to fingerprint computation
- `app/api/v1/incidents.py` — Add /similar endpoint, include pattern_match in response
- `app/schemas/incident.py` — Add fingerprint and pattern_match to response schema

### Frontend (New)
- `frontend/src/components/incidents/PatternMatchCard.tsx`
- `frontend/src/hooks/useIncidentSimilar.ts`

### Frontend (Modified)
- `frontend/src/pages/IncidentDetailPage.tsx` — Add PatternMatchCard
- `frontend/src/pages/IncidentsPage.tsx` — Add recurrence badge to incident cards

---

## 8. Verification

1. `alembic upgrade head` — migration applies cleanly
2. Trigger a monitoring run that creates an incident → verify fingerprint is set
3. Trigger the same failure again → verify second incident has same fingerprint
4. Check `/incidents/{id}` response includes `pattern_match` with occurrence_count = 2
5. Resolve first incident with notes → verify cache updates with resolution data
6. Third occurrence → verify pattern_match shows "Seen 3x" with avg resolution time
7. Frontend: IncidentDetailPage shows "Known Pattern" card
8. Frontend: IncidentsPage shows "Seen Nx" badge
9. `cd frontend && npm run build` — TypeScript compiles clean
