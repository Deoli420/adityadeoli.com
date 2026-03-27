# Phase 1: FastAPI Integration Tests — Complete Learning Guide

> **Purpose**: This guide explains every decision, concept, and pattern used in SentinelAI's integration test suite. Written for someone preparing for Senior SDET interviews.

---

## 1. What is FastAPI?

**FastAPI** is a modern Python web framework built on top of Starlette (ASGI) and Pydantic (validation). SentinelAI's entire backend is a FastAPI application.

**Why it matters for testing**: FastAPI provides `TestClient` — a way to call your API endpoints directly in Python without starting a real HTTP server. This is the foundation of our entire integration test strategy.

**Interview Q: "Why did you choose FastAPI's TestClient over tools like Postman or curl for testing?"**
> "TestClient runs in-process, meaning tests execute in milliseconds instead of seconds. There's no network hop, no Docker container, no port conflicts. I get the same HTTP contract validation (status codes, headers, JSON bodies) but 100x faster. This lets me run 100 tests on every save, which Postman collections can't do."

---

## 2. What is TestClient and How Does it Work?

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/api/v1/health")
assert response.status_code == 200
```

**Under the hood**: TestClient wraps `httpx` (an HTTP client library). When you call `client.get("/api/v1/health")`, it:
1. Creates an HTTP request object
2. Passes it directly to FastAPI's ASGI interface (no TCP socket)
3. FastAPI routes it through middleware → dependency injection → route handler
4. Returns a real `Response` object with status_code, headers, json()

**Key insight**: Everything your production code does — auth middleware, Pydantic validation, database queries, error handling — runs during the test. The only thing that's different is the database (SQLite instead of PostgreSQL).

**Interview Q: "What's the difference between unit tests and integration tests?"**
> "Unit tests mock everything and test one function in isolation. Integration tests test how real components work together. Our FastAPI TestClient tests are integration tests because they exercise the full stack: HTTP routing → auth middleware → Pydantic validation → service layer → repository → database. The only mock is the database engine (SQLite instead of Postgres)."

---

## 3. Why SQLite for Tests Instead of PostgreSQL?

**The tradeoff**:
- PostgreSQL: exact production parity, but needs Docker, takes 5+ seconds to start, port conflicts in CI
- SQLite in-memory: starts in 0ms, no files, no cleanup, but has minor SQL dialect differences

**We chose SQLite because**:
1. **Speed**: 100 tests in <5 seconds vs 30+ seconds with Postgres
2. **No infrastructure**: No Docker, no ports, no cleanup. Works on any machine with Python
3. **CI simplicity**: GitHub Actions doesn't need a service container
4. **Sufficient fidelity**: 99% of our SQLAlchemy queries work identically on both engines. The 1% (PostgreSQL-specific functions like `date_trunc`) we skip with `@pytest.mark.skip(reason="pg-only")`

**Interview Q: "What are the risks of using SQLite for tests when production uses PostgreSQL?"**
> "Three risks: (1) PostgreSQL-specific SQL functions won't work — we mark those tests as pg-only and run them separately in Docker. (2) Concurrency behavior differs — SQLite serializes writes, Postgres doesn't. (3) Type coercion differs — SQLite is more permissive. We mitigate by also running the existing Playwright E2E suite against real Postgres in Docker for critical paths."

---

## 4. pytest Fundamentals

### 4.1 Why pytest?

pytest is the de facto Python testing framework. Compared to `unittest`:
- No boilerplate classes required
- Fixtures instead of setUp/tearDown (composable, scoped, lazy)
- Parametrize for data-driven tests
- Markers for categorization
- Rich plugin ecosystem (pytest-asyncio, pytest-cov, pytest-xdist)

### 4.2 Test Discovery

pytest finds tests by convention:
- Files: `test_*.py` or `*_test.py`
- Functions: `test_*`
- Classes: `Test*` (with `test_*` methods)

We use `test_*.py` files with plain functions (no classes) — the modern pytest style.

### 4.3 The AAA Pattern

Every test follows **Arrange-Act-Assert**:

```python
def test_create_endpoint(client, auth_headers):
    # ARRANGE: prepare test data
    payload = {"name": "Test API", "url": "https://api.example.com", ...}

    # ACT: call the endpoint
    response = client.post("/api/v1/endpoints/", json=payload, headers=auth_headers)

    # ASSERT: verify the result
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test API"
```

**Interview Q: "Why is AAA important?"**
> "It makes tests readable and predictable. Anyone can look at a test and immediately understand: what's the setup, what action is being tested, and what's the expected outcome. It also prevents the common anti-pattern of interleaving assertions with actions, which makes failures hard to diagnose."

### 4.4 Fixtures

Fixtures are pytest's dependency injection system. Instead of setUp/tearDown:

```python
@pytest.fixture
def auth_headers(client):
    """Login and return auth headers — reusable across all tests."""
    response = client.post("/api/v1/auth/login", json={...})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

**Fixture scopes**:
- `function` (default): fresh per test — use for data that tests modify
- `session`: once per entire test run — use for expensive setup (app creation)
- `module`: once per test file — rarely used

**Interview Q: "When would you use session scope vs function scope?"**
> "Session scope for things that are expensive to create and safe to share — like the FastAPI app instance and database tables. Function scope for things that tests might modify — like authenticated clients or test data. If a test changes data, the next test must start with a clean state."

### 4.5 Markers

Markers categorize tests for selective execution:

```python
@pytest.mark.smoke
def test_health_check(client):
    """Critical path — must pass on every deploy."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

@pytest.mark.regression
def test_create_endpoint_missing_name(client, auth_headers):
    """Edge case — validation error."""
    response = client.post("/api/v1/endpoints/", json={"url": "..."}, headers=auth_headers)
    assert response.status_code == 422
```

Run selectively:
```bash
pytest -m smoke            # Only smoke tests (~15, <2s)
pytest -m "not integration"  # Everything except slow integration tests
pytest -m "smoke or regression"  # Smoke + regression
```

**Interview Q: "How do you decide what's a smoke test vs regression vs integration?"**
> "Smoke tests cover the critical happy paths that must work for the product to be usable — login, view dashboard, create an endpoint. If any smoke test fails, the build is broken. Regression tests cover all CRUD operations, validation errors, edge cases — they prevent bugs from recurring. Integration tests verify cross-feature flows like 'create endpoint → trigger monitor → verify incident is created' — they catch problems in how features interact."

---

## 5. Test Isolation

**Every test must be independent.** It cannot depend on another test's side effects.

**How we achieve this**:
1. **Transaction rollback**: Each test runs in a database transaction that rolls back after the test. No data persists between tests.
2. **Fresh client per test**: The `client` fixture creates a new TestClient for each test function.
3. **Factories instead of shared data**: Instead of inserting data in a setup step that all tests share, each test creates its own data using factory functions.

**Interview Q: "What happens when tests depend on each other?"**
> "Order-dependent tests are the #1 cause of flaky CI. Test A creates a record, test B reads it — if A is skipped or fails, B fails too. Worse, running tests in a different order (pytest-randomly) breaks everything. We prevent this by rolling back each test's database changes and never sharing mutable state."

---

## 6. Factory Pattern

Instead of hardcoding test data:

```python
# BAD — hardcoded, brittle, hard to maintain
def test_create_endpoint(client, auth_headers):
    response = client.post("/api/v1/endpoints/", json={
        "name": "My API",
        "url": "https://api.example.com/health",
        "method": "GET",
        "expected_status": 200,
        "monitoring_interval_seconds": 300
    }, headers=auth_headers)
```

We use factories:

```python
# GOOD — flexible, DRY, self-documenting
def test_create_endpoint(client, auth_headers, endpoint_factory):
    payload = endpoint_factory()  # Returns valid defaults
    response = client.post("/api/v1/endpoints/", json=payload, headers=auth_headers)
    assert response.status_code == 201

def test_create_endpoint_custom_interval(client, auth_headers, endpoint_factory):
    payload = endpoint_factory(monitoring_interval_seconds=60)  # Override one field
    response = client.post("/api/v1/endpoints/", json=payload, headers=auth_headers)
    assert response.json()["monitoring_interval_seconds"] == 60
```

**Interview Q: "Why factories instead of fixtures with hardcoded data?"**
> "Factories are composable — I can override any field without duplicating the entire payload. They're self-documenting — `endpoint_factory(method='POST')` tells you exactly what's different about this test. And they reduce maintenance — when the API adds a required field, I update one factory, not 50 tests."

---

## 7. RBAC Testing Strategy

**Role-Based Access Control** tests verify that permissions are enforced correctly. This is critical for SentinelAI because we have 4 roles: OWNER, ADMIN, MEMBER, VIEWER.

Our approach:

```python
@pytest.mark.integration
class TestRBAC:
    def test_viewer_cannot_create_endpoint(self, client, viewer_headers, endpoint_factory):
        """VIEWER role should get 403 on write operations."""
        response = client.post("/api/v1/endpoints/", json=endpoint_factory(), headers=viewer_headers)
        assert response.status_code == 403

    def test_member_can_create_endpoint(self, client, member_headers, endpoint_factory):
        """MEMBER role should succeed on write operations."""
        response = client.post("/api/v1/endpoints/", json=endpoint_factory(), headers=member_headers)
        assert response.status_code == 201

    def test_member_cannot_invite_users(self, client, member_headers):
        """Only ADMIN+ can invite."""
        response = client.post("/api/v1/invites/", json={"email": "new@test.com"}, headers=member_headers)
        assert response.status_code == 403
```

**Interview Q: "How do you test authorization without testing authentication?"**
> "I separate them. Auth tests verify login/signup/token mechanics. RBAC tests assume auth works (via fixture-provided headers) and verify that specific roles get 403 on restricted endpoints. This way, if a RBAC test fails, I know it's a permissions problem, not a login problem."

---

## 8. Test Naming Conventions

```
test_{action}_{condition}_{expected_result}
```

Examples:
- `test_create_endpoint_valid_data_returns_201`
- `test_create_endpoint_missing_name_returns_422`
- `test_login_wrong_password_returns_401`
- `test_viewer_cannot_delete_endpoint`
- `test_resolve_incident_updates_fingerprint_cache`

**Why this matters**: When a test fails in CI, the name alone should tell you what broke. `test_3` tells you nothing. `test_create_endpoint_missing_name_returns_422` tells you exactly what to investigate.

---

## 9. What We're NOT Testing Here

| What | Where we test it instead |
|------|------------------------|
| Frontend rendering | Phase 2: Playwright browser tests |
| CSS/layout | Phase 2: Visual regression |
| Database migrations | Alembic `upgrade head` in CI |
| Production Docker setup | Existing E2E suite with docker-compose.test.yml |
| WebSocket events | Existing E2E suite (needs real server) |
| LLM responses | Mocked — we test our code's handling of LLM output |

**Interview Q: "What's NOT covered by your integration tests?"**
> "Three things: (1) Frontend — we need browser tests for that. (2) PostgreSQL-specific behavior — our SQLite tests can't test `date_trunc` or advisory locks. (3) Infrastructure — Docker networking, nginx routing, SSL. Each gap has a specific test type that covers it."

---

## 10. Running Tests

```bash
# From project root
cd tests

# Run all integration tests
pytest integration/ -v

# Run only smoke tests (CI gate)
pytest integration/ -m smoke -v

# Run with coverage report
pytest integration/ --cov=app --cov-report=term-missing

# Run a single test file
pytest integration/test_auth.py -v

# Run a single test
pytest integration/test_auth.py::test_login_valid_credentials -v

# Run in parallel (with pytest-xdist)
pytest integration/ -n auto
```

---

## 11. Common Interview Questions

**Q: "How do you handle flaky tests?"**
> "First, I identify the root cause — usually shared state, timing issues, or external dependencies. For shared state, I ensure each test has its own transaction. For timing, I avoid sleep() and use polling with timeouts. For external deps, I mock them. If a test is genuinely non-deterministic (race condition in async code), I use `@pytest.mark.flaky(reruns=2)` as a temporary measure while fixing the root cause."

**Q: "How do you decide test coverage priorities?"**
> "I use the risk × frequency matrix. High-risk features that users hit often (login, dashboard, create endpoint) get smoke tests. Every API route gets at least one happy-path and one error-case regression test. Cross-feature flows that involve multiple services get integration tests. I don't chase 100% coverage — I chase 100% of business-critical paths."

**Q: "What's your approach to testing async code?"**
> "FastAPI's TestClient handles async transparently — it runs the async event loop internally. For our tests, we write synchronous test functions that call client.get()/post(), and the TestClient bridges to async handlers. We only need pytest-asyncio when testing async functions directly (not through HTTP)."

**Q: "How do you test database interactions without a real database?"**
> "SQLAlchemy's engine abstraction lets us swap PostgreSQL for SQLite at test time by overriding the DATABASE_URL. We create all tables using metadata.create_all() instead of running migrations. Each test runs in a transaction that rolls back, so tests are isolated. The tradeoff is we can't test Postgres-specific features, which we cover in a separate Docker-based suite."

---

## 12. Key Libraries Reference

| Library | What it does | Why we use it |
|---------|-------------|---------------|
| `pytest` | Test framework | Industry standard, fixtures, markers, plugins |
| `httpx` | HTTP client (under TestClient) | Async-capable, same API as requests |
| `fastapi.testclient.TestClient` | In-process HTTP testing | No server needed, full stack coverage |
| `pytest-cov` | Coverage reporting | Know what's untested |
| `factory-boy` (optional) | Data factories | Cleaner than manual dicts, but we use simple functions |
| `pytest-xdist` | Parallel execution | Run tests 4x faster on multi-core |

---

*This guide is part of SentinelAI's test automation documentation. Phase 2 covers Playwright browser tests. Phase 3 covers CI/CD pipeline integration.*
