# SentinelAI E2E Test Architecture

> Written from the perspective of the QA engineer who designed and built this test suite.

---

## Table of Contents

1. [Philosophy & Goals](#1-philosophy--goals)
2. [Why These Tools](#2-why-these-tools)
3. [Infrastructure Overview](#3-infrastructure-overview)
4. [Test Data Strategy](#4-test-data-strategy)
5. [Mock Server Design](#5-mock-server-design)
6. [Test Suite Breakdown](#6-test-suite-breakdown)
7. [Fixture Architecture](#7-fixture-architecture)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Bugs Discovered](#9-bugs-discovered)
10. [Running Locally](#10-running-locally)

---

## 1. Philosophy & Goals

The E2E test suite was built around three principles:

**Test the real system.** Every test hits the actual FastAPI application running inside Docker, connected to a real PostgreSQL database. No mocks of internal services, no in-process test clients. The tests see exactly what a production client would see.

**Every feature gets covered.** SentinelAI has 12+ feature areas (auth, endpoints, monitoring, SLA, alert rules, incidents, security scanning, contract testing, dashboard, exports, proxy, CI integration, schema drift, AI telemetry, onboarding, multi-tenancy). Each feature has its own test module with positive and negative test cases.

**Tests must run in CI without manual intervention.** The entire infrastructure (database, mock server, API) spins up from a single `docker compose up`, seeds itself with data, runs 111 tests, and tears down. No local dependencies beyond Docker and Python.

---

## 2. Why These Tools

### Playwright (not requests, not httpx)

**Choice:** `pytest-playwright` with `APIRequestContext` for HTTP-level API testing.

**Why not `requests` or `httpx`?**

- Playwright manages connection pooling and session state automatically
- `APIRequestContext` provides persistent sessions with headers (authentication tokens survive across all requests in a session)
- Playwright's test infrastructure handles browser installation for future UI tests
- Built-in retry mechanisms and timeout handling
- JUnit XML output for CI integration without extra plugins

**Why not `TestClient` (FastAPI's built-in)?**

- `TestClient` runs the app in-process, bypassing Docker, networking, database connections, and startup/shutdown lifecycle
- We wanted to test the actual deployment: Docker image builds correctly, database connects, migrations run, CORS works, rate limiting works
- `TestClient` would miss the bugs we actually found (MissingGreenlet errors, credential scanner type mismatches, SSRF behavior with Docker networking)

### Docker Compose (not fixtures with test databases)

**Choice:** Three Docker containers (PostgreSQL, Mock Server, API) orchestrated by Docker Compose.

**Why:**

- Mirrors the production deployment topology exactly
- Tests the Docker image build process (Dockerfile correctness)
- Tests real network communication between services
- Tests database connection pooling under real asyncpg
- Tests environment variable configuration
- Avoids "works on my machine" — identical on macOS, Linux, CI

### pytest (not unittest, not Robot Framework)

**Choice:** pytest with markers, fixtures, and session-scoped setup.

**Why:**

- Fixtures with dependency injection reduce boilerplate dramatically (e.g., `admin_api` fixture chains: `playwright` -> `api` -> `admin_token` -> `admin_api`)
- Markers (`@pytest.mark.security`, `@pytest.mark.multi_tenant`) enable selective test execution
- Session-scoped fixtures create expensive resources (DB records, auth tokens) once and share them across all 111 tests
- Rich assertion introspection shows exactly what failed without custom error messages
- Extensive plugin ecosystem (playwright, junit-xml, etc.)

---

## 3. Infrastructure Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Host Machine                                 │
│                                                                      │
│  ┌──────────────┐                                                    │
│  │  Test Runner  │  pytest + playwright                              │
│  │  (Python)     │  Sends HTTP requests to localhost:8000            │
│  └──────┬───────┘                                                    │
│         │ HTTP                                                       │
│  ───────┼────────────────── Docker Network (test-net) ──────────     │
│         │                                                            │
│  ┌──────▼───────┐    ┌──────────────┐    ┌──────────────────┐       │
│  │   api-test   │    │  mock-server │    │     db-test      │       │
│  │ FastAPI:8000 │───▶│  FastAPI:9999│    │ PostgreSQL:5432  │       │
│  │              │    │              │    │ (exposed: 5433)  │       │
│  │  The real    │    │  Simulates   │    │                  │       │
│  │  SentinelAI  │    │  external    │    │  sentinel_test   │       │
│  │  application │◀───│  APIs        │    │  database        │       │
│  └──────┬───────┘    └──────────────┘    └──────────────────┘       │
│         │                                        ▲                   │
│         └────────────────────────────────────────┘                   │
│                    asyncpg connection                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Service Details

| Service | Image | Purpose | Port (Host) | Port (Docker) |
|---------|-------|---------|-------------|---------------|
| `db-test` | `postgres:16-alpine` | Test database | 5433 | 5432 |
| `mock-server` | Custom (Python) | Simulates external APIs | 9999 | 9999 |
| `api-test` | SentinelAI Dockerfile | The actual application | 8000 | 8000 |

### Key Environment Variables for Testing

| Variable | Value | Why |
|----------|-------|-----|
| `SCHEDULER_ENABLED=false` | Disables background cron | Tests trigger runs manually; background scheduler would interfere |
| `AI_ENABLED=false` | Disables OpenAI calls | No API key in test env; tests verify behavior without AI |
| `WEBHOOK_ENABLED=false` | Disables webhook notifications | No webhook receiver in test env |
| `RATE_LIMIT_ENABLED=false` | Disables slowapi rate limiting | Tests make many rapid login calls; rate limits cause cascading failures |
| `SSRF_ALLOWLIST_HOSTS=mock-server` | Allows proxy to reach mock server | Docker-internal hostnames resolve to private IPs (172.x), which SSRF protection blocks |
| `BCRYPT_ROUNDS=4` | Minimum bcrypt cost | Test seeding creates 3 users; rounds=12 would add ~3 seconds per user |
| `SECRET_KEY=test-secret-key-e2e-only` | Static JWT key | Predictable token generation for test sessions |
| `ACCESS_TOKEN_EXPIRE_MINUTES=60` | Long token lifetime | Session-scoped tokens must survive the entire test run |

---

## 4. Test Data Strategy

### What Data, Why, and Where

Test data is seeded in two layers:

#### Layer 1: Database Seed (`seed_data.py`) — Pre-Test Static Data

**What:** 2 organizations, 3 users (different roles and tenants).

**Why:** Authentication and multi-tenancy tests need users to exist before any test runs. Creating users through the API would require registration endpoints (which SentinelAI doesn't expose — users are created by admins).

**Where:** Directly into PostgreSQL via `psycopg2` (raw SQL INSERTs).

**Why raw SQL instead of the API?**

- The API requires authentication to create anything, but we need users to authenticate in the first place (chicken-and-egg problem)
- Raw SQL is idempotent with `ON CONFLICT DO NOTHING` — safe to re-run
- Faster than HTTP round-trips for foundational data

```
Organizations:
  test-org    → Primary test organization
  other-org   → Multi-tenancy isolation tests

Users:
  admin@test.com     (ADMIN, test-org)    → Main test user, creates all test resources
  member@test.com    (MEMBER, test-org)   → RBAC tests (limited permissions)
  admin@other.com    (ADMIN, other-org)   → Multi-tenancy isolation (must see nothing from test-org)
```

**Password handling:** All users share `testpassword123`, hashed with bcrypt (rounds=4 for speed). The seed script uses the same bcrypt library as the app to ensure hash compatibility.

**Why `failed_login_attempts=0`?** The `users` table has a NOT NULL constraint on this column (for account lockout tracking). If omitted, PostgreSQL rejects the INSERT. This was a bug discovered during the first test run.

#### Layer 2: Fixture-Created Data (`conftest.py`) — Test Session Data

**What:** Endpoints, runs, incidents, SLA configs, alert rules — created through the API.

**Why:** These resources test the full API lifecycle (create → read → update → delete). Creating them through the API validates the creation endpoints themselves.

**Where:** In pytest fixtures (`test_endpoint`, `failing_endpoint`, `credential_leak_endpoint`), which call `admin_api.post("/api/v1/endpoints", ...)`.

**Fixture scope: `session`** — Created once, shared across all 111 tests. This is intentional:

- Creating endpoints through the API takes ~50ms each (HTTP + DB + response)
- With `function` scope, every test would re-create endpoints: 111 tests x 50ms = 5.5s wasted
- Session-scoped endpoints are read-only references — tests that modify data create their own temporary resources

```python
@pytest.fixture(scope="session")
def test_endpoint(admin_api, mock_url):
    """Points to mock server's /api/healthy — always returns 200."""
    resp = admin_api.post("/api/v1/endpoints", data={
        "name": "E2E Healthy Endpoint",
        "url": f"{mock_url}/api/healthy",
        "method": "GET",
        "expected_status": 200,
        "expected_schema": {"status": "string", ...},
    })
    return resp.json()  # {'id': 'uuid', 'name': '...', ...}
```

### Data Isolation Strategy

**Between test modules:** Each module gets a fresh mock server state via `reset_mock_server` (autouse fixture, module-scoped). This resets call counters and intermittent state so schema-drift tests don't interfere with health tests.

**Between organizations:** Multi-tenancy tests use `other_org_api` (authenticated as `admin@other.com` in `other-org`) and verify it cannot see `test-org` data. This validates the application's `organization_id` filtering at the database query level.

**Between test runs:** The database accumulates data across pytest runs (session-scoped fixtures create new records each time). This is acceptable because:
- Tests assert on relative conditions ("list has at least 1 item") not absolute ones ("list has exactly 3 items")
- The CI endpoint's exact-match preference handles duplicate endpoint names gracefully

---

## 5. Mock Server Design

### Why a Custom Mock Server?

SentinelAI monitors external APIs. The monitoring pipeline makes HTTP requests to those APIs, analyzes responses, and detects anomalies. In tests, we need:

1. **Deterministic responses** — A "healthy" endpoint must always return 200 with a known schema
2. **Controllable failure modes** — Schema drift, credential leaks, slow responses, intermittent failures
3. **Call tracking** — Verify the pipeline actually made requests

Generic mock tools (WireMock, Prism) don't provide scenario-specific behaviors like "return credentials in the response body" or "change schema after 3 calls."

### Scenarios and Their Test Purpose

| Endpoint | Behavior | Tests It Enables |
|----------|----------|-----------------|
| `GET /api/healthy` | Always 200 + stable JSON | Baseline monitoring, SLA tracking, performance stats |
| `GET /api/failing` | Always 500 | Failure detection, incident creation, failure rate calculation |
| `GET /api/slow?delay=N` | Configurable delay | Performance spike detection, timeout handling |
| `GET /api/intermittent` | 500 on odd calls, 200 on even | Intermittent failure tracking, retry logic |
| `GET /api/schema-drift` | Returns extra fields after 3rd call | Schema drift detection, snapshot versioning |
| `GET /api/credential-leak` | Returns AWS keys, JWTs, passwords | Credential scanner validation, security findings |
| `GET /api/timeout` | Sleeps 120 seconds | Timeout handling in monitoring pipeline |
| `GET /api/protected` | 401 without `Bearer test-token-123` | Auth header forwarding in endpoint config |
| `GET /api/openapi-compliant` | Matches predefined OpenAPI spec | Contract validation (compliant case) |
| `GET /api/openapi-violating` | Violates type constraints | Contract validation (violation detection) |
| `POST /api/echo` | Returns request body back | Proxy POST forwarding, body handling |
| `GET /api/custom` | Configurable via `/admin/configure` | Dynamic test scenarios |

### Admin Controls

```
POST /admin/reset      → Reset all call counts and state
GET  /admin/stats      → Get call counts per endpoint
POST /admin/configure  → Set custom response (status, body, delay)
```

Reset is called automatically before each test module via the `reset_mock_server` autouse fixture.

---

## 6. Test Suite Breakdown

### 18 Test Modules, 111 Tests

| # | Module | Tests | Feature Area | Key Assertions |
|---|--------|-------|-------------|----------------|
| 01 | `test_01_health.py` | 3 | Health check | 200 status, JSON content-type, 404 for unknown routes |
| 02 | `test_02_auth.py` | 8 | Authentication | Login/logout, token validation, wrong credentials, missing fields |
| 03 | `test_03_endpoints.py` | 9 | Endpoint CRUD | Create, read, update, delete, validation errors, auth required |
| 04 | `test_04_monitoring.py` | 7 | Monitoring pipeline | Run healthy/failing endpoints, performance data, run history |
| 05 | `test_05_sla.py` | 5 | SLA tracking | Create/update SLA config, uptime stats, uptime reflects runs |
| 06 | `test_06_alert_rules.py` | 8 | Alert rules | CRUD for latency/failure/risk rules, toggle enable/disable |
| 07 | `test_07_incidents.py` | 7 | Incident management | Create, list, filter, status transitions, notes, timeline |
| 08 | `test_08_security.py` | 5 | Credential scanning | Scan detects leaks, findings API, stats, clean endpoints have none |
| 09 | `test_09_contracts.py` | 4 | API contract testing | Upload OpenAPI spec, validate compliant/violating responses |
| 10 | `test_10_dashboard.py` | 6 | Dashboard analytics | Stats, trends, top failures, risk distribution, uptime overview |
| 11 | `test_11_export.py` | 6 | CSV export | Runs, incidents, risk scores, SLA exports, date filtering, auth |
| 12 | `test_12_proxy.py` | 6 | Proxy & SSRF | GET/POST forwarding, SSRF blocks (localhost, private IP, metadata) |
| 13 | `test_13_ci.py` | 4 | CI integration | Run by ID, run by name, nonexistent endpoint, auth required |
| 14 | `test_14_schema_drift.py` | 2 | Schema drift | Drift detection, schema history timeline |
| 15 | `test_15_ai_telemetry.py` | 2 | AI telemetry | Stats endpoint, auth required |
| 16 | `test_16_onboarding.py` | 2 | Onboarding | Checklist status, reflects setup progress |
| 17 | `test_17_multi_tenancy.py` | 6 | Multi-tenancy | Org isolation: can't see, access, trigger, or list other org's data |
| 18 | `test_18_error_handling.py` | 11 | Error handling | 422 validations, 404 not found, correct content-type |

### Test Ordering

Tests are numbered (`test_01_` through `test_18_`) so they execute in dependency order:

1. **Health** — Verify the API is alive (fails fast if Docker is broken)
2. **Auth** — Verify login works (all subsequent tests depend on auth tokens)
3. **Endpoints** — Create the resources that monitoring, SLA, and alerts depend on
4. **Monitoring** — Create runs (needed by SLA, dashboard, export)
5. **SLA → Alerts → Incidents** — Features that build on top of endpoints and runs
6. **Security → Contracts → Dashboard → Export** — Analytical features
7. **Proxy → CI** — Integration features
8. **Multi-tenancy → Error handling** — Cross-cutting concerns (run last to avoid side effects)

### Test Design Patterns

**Positive + Negative in every module:**
```python
def test_create_endpoint(self, admin_api):           # Happy path
def test_create_endpoint_invalid_url(self, admin_api): # Validation error
def test_create_endpoint_requires_auth(self, api):     # Auth enforcement
```

**State verification after mutations:**
```python
def test_transition_to_resolved(self, admin_api, ...):
    # Act: change status
    resp = admin_api.patch(f"/api/v1/incidents/{id}/status", data={"status": "RESOLVED"})
    assert resp.ok
    # Verify: re-read and confirm
    detail = admin_api.get(f"/api/v1/incidents/{id}")
    assert detail.json()["status"] == "RESOLVED"
```

**Multi-tenancy as a first-class concern:**
```python
def test_other_org_cannot_see_test_org_endpoints(self, other_org_api):
    resp = other_org_api.get("/api/v1/endpoints")
    assert resp.ok
    assert len(resp.json()) == 0  # other-org sees nothing
```

---

## 7. Fixture Architecture

### Fixture Dependency Graph

```
playwright (built-in)
  └─ api (session) — unauthenticated APIRequestContext
       ├─ admin_token (session) — POST /auth/login
       │    └─ admin_api (session) — APIRequestContext + Bearer header
       │         ├─ test_endpoint (session) — POST /endpoints
       │         ├─ failing_endpoint (session)
       │         └─ credential_leak_endpoint (session)
       ├─ member_token (session)
       │    └─ member_api (session)
       └─ other_org_token (session)
            └─ other_org_api (session)

mock_url (session) — "http://mock-server:9999" (Docker-internal)
mock_url_external (session) — "http://localhost:9999" (host-accessible)
reset_mock_server (autouse, module) — POST /admin/reset
```

### Scope Choices

| Fixture | Scope | Rationale |
|---------|-------|-----------|
| `api`, `admin_api`, etc. | `session` | HTTP connections are expensive to establish; reuse across all tests |
| `admin_token` | `session` | Login once, use the JWT for all 111 tests |
| `test_endpoint` | `session` | Create once, reference everywhere (monitoring, SLA, alerts, etc.) |
| `reset_mock_server` | `module` | Reset mock state between test files to prevent cross-contamination |

### Why Not Function-Scoped Fixtures?

With session-scoped auth tokens and endpoints, the test suite runs in **~5 seconds** for 111 tests. With function-scoped fixtures:

- 111 login calls (each requires bcrypt verification: ~50ms) = ~5.5 seconds just for auth
- 111 endpoint creation calls = ~5.5 seconds
- Total overhead: ~11 seconds of pure fixture setup

More importantly, function-scoped fixtures wouldn't test the real-world usage pattern where a single auth token is used across many API calls.

---

## 8. CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/e2e-tests.yml`)

```
Trigger: push to main OR pull request against main
Concurrency: cancel-in-progress per branch

Step 1: Checkout code
Step 2: docker compose up -d --build  (builds 3 containers)
Step 3: Wait for health checks (API + mock server)
Step 4: alembic stamp head  (tables created by app startup)
Step 5: Set up Python 3.12 + install test deps + playwright install
Step 6: Seed test database
Step 7: pytest --junit-xml=results/e2e-results.xml
Step 8: Upload test artifacts (JUnit XML + test output)
Step 9: Publish test summary to GitHub PR
Step 10: Fail if tests failed (parse JUnit XML)
Step 11: Tear down Docker Compose
```

### Why `alembic stamp head` Instead of `alembic upgrade head`?

The FastAPI app calls `Base.metadata.create_all(engine)` during startup (in `main.py`'s lifespan handler). This creates all tables immediately. Running `alembic upgrade head` afterward tries to create the same tables, causing `DuplicateTable` errors.

`alembic stamp head` simply marks the migration version as "already applied" without executing any SQL. This keeps Alembic's version table in sync without conflicting with `create_all`.

### Artifacts

- `results/e2e-results.xml` — JUnit XML for test result parsing
- `results/test-output.txt` — Full pytest output for debugging

---

## 9. Bugs Discovered

The E2E tests discovered 6 real application bugs before they reached production:

### Bug 1: Credential Scanner Type Error
**File:** `app/monitoring/credential_scanner.py`
**Symptom:** All monitoring runs returned 500 Internal Server Error
**Root Cause:** `response_body` arrives as a `dict` (parsed JSON) but the scanner called `.strip()` on it, which is a string method
**Fix:** Added `isinstance(response_body, dict)` check to convert to JSON string before processing

### Bug 2: MissingGreenlet on Endpoint Update
**File:** `app/repositories/api_endpoint.py`
**Symptom:** PATCH `/api/v1/endpoints/{id}` returned 500
**Root Cause:** After `flush()`, SQLAlchemy needed to lazy-load `updated_at` (set by the DB), but async SQLAlchemy can't do lazy I/O outside a greenlet
**Fix:** Added `await self._session.refresh(endpoint)` after `flush()`

### Bug 3: MissingGreenlet on SLA Update
**File:** `app/repositories/endpoint_sla.py`
**Same pattern as Bug 2.** Added `refresh()` after `flush()`.

### Bug 4: MissingGreenlet on Incidents List
**File:** `app/repositories/incident.py`
**Symptom:** GET `/api/v1/incidents/` returned 500
**Root Cause:** `IncidentService.list_incidents()` accessed `incident.endpoint.name` — a lazy-loaded relationship that triggered I/O outside the async context
**Fix:** Added `.options(selectinload(Incident.endpoint))` to the query

### Bug 5: CI Endpoint Used Uninitialized ApiRunner
**File:** `app/api/v1/ci.py`
**Symptom:** CI runs always returned `is_success: false`
**Root Cause:** Created `ApiRunner()` (new instance) instead of using `api_runner` (singleton with `startup()` called). The new instance had `self._client = None`, so every request returned an error.
**Fix:** Changed to use the `api_runner` singleton (same as the monitor endpoint does)

### Bug 6: CI Endpoint Name Matching Too Broad
**File:** `app/api/v1/ci.py`
**Symptom:** CI run by name returned 400 "Multiple matches"
**Root Cause:** Substring matching (`name in e.name`) found duplicates when test runs accumulated data
**Fix:** Added exact-match preference before falling back to substring matching

---

## 10. Running Locally

### Quick Start

```bash
cd tests
bash run_tests.sh            # Full automated run
bash run_tests.sh -m smoke   # Only smoke tests
bash run_tests.sh --teardown # Clean up containers
```

### Manual Step-by-Step

```bash
# 1. Start infrastructure
cd tests
docker compose -f docker-compose.test.yml up -d --build

# 2. Wait for health
curl http://localhost:8000/api/v1/health   # Should return {"status": "ok"}
curl http://localhost:9999/health           # Should return {"status": "ok"}

# 3. Stamp Alembic
docker compose -f docker-compose.test.yml exec api-test \
  sh -c 'cd /app && PYTHONPATH=/app alembic stamp head'

# 4. Seed data
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-test.txt
playwright install chromium
python seed_data.py --host localhost --port 5433

# 5. Run tests
export API_BASE_URL=http://localhost:8000
export MOCK_SERVER_URL=http://localhost:9999
export MOCK_SERVER_INTERNAL_URL=http://mock-server:9999
pytest -v

# 6. Tear down
docker compose -f docker-compose.test.yml down -v
```

### Selective Execution

```bash
pytest e2e/test_02_auth.py -v              # Single module
pytest -m security -v                      # By marker
pytest -k "test_proxy" -v                  # By name pattern
pytest e2e/test_08_security.py::TestCredentialLeakDetection::test_scan_endpoint_with_credential_leak -v  # Single test
```

### Debugging Tips

```bash
# View API logs for 500 errors
docker compose -f docker-compose.test.yml logs api-test --tail=50

# View mock server call counts
curl http://localhost:9999/admin/stats

# Run with full traceback
pytest -v --tb=long

# Run with print output visible
pytest -v -s
```

---

## File Map

```
tests/
├── architecture.md              ← You are here
├── docker-compose.test.yml      ← 3-service Docker Compose
├── pytest.ini                   ← Test markers, paths, defaults
├── requirements-test.txt        ← pytest, playwright, psycopg2, bcrypt
├── run_tests.sh                 ← One-command test runner
├── seed_data.py                 ← Database seeder (orgs + users)
├── mock_server/
│   ├── Dockerfile               ← Python 3.13 slim + uvicorn
│   ├── main.py                  ← 14 API scenarios + admin controls
│   └── requirements.txt         ← fastapi, uvicorn
└── e2e/
    ├── conftest.py              ← Fixtures: auth contexts, shared endpoints
    ├── test_01_health.py        ← Health check smoke tests (3 tests)
    ├── test_02_auth.py          ← Login, tokens, logout (8 tests)
    ├── test_03_endpoints.py     ← Endpoint CRUD (9 tests)
    ├── test_04_monitoring.py    ← Pipeline runs, history (7 tests)
    ├── test_05_sla.py           ← SLA config + uptime (5 tests)
    ├── test_06_alert_rules.py   ← Alert rule CRUD (8 tests)
    ├── test_07_incidents.py     ← Incident lifecycle (7 tests)
    ├── test_08_security.py      ← Credential scanning (5 tests)
    ├── test_09_contracts.py     ← OpenAPI contract tests (4 tests)
    ├── test_10_dashboard.py     ← Dashboard analytics (6 tests)
    ├── test_11_export.py        ← CSV exports (6 tests)
    ├── test_12_proxy.py         ← Proxy + SSRF protection (6 tests)
    ├── test_13_ci.py            ← CI integration (4 tests)
    ├── test_14_schema_drift.py  ← Schema versioning (2 tests)
    ├── test_15_ai_telemetry.py  ← AI usage stats (2 tests)
    ├── test_16_onboarding.py    ← Onboarding checklist (2 tests)
    ├── test_17_multi_tenancy.py ← Org isolation (6 tests)
    └── test_18_error_handling.py← Validation + 404s (11 tests)
```
