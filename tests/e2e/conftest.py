"""
SentinelAI E2E Test Fixtures

Provides authenticated Playwright API contexts, mock server helpers,
and shared test data (endpoints, runs) used across all test modules.
"""

import os
import pytest
from playwright.sync_api import Playwright, APIRequestContext

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
MOCK_BASE = os.getenv("MOCK_SERVER_URL", "http://localhost:9999")


# ── Unauthenticated API context ─────────────────────────────────────────


@pytest.fixture(scope="session")
def api(playwright: Playwright) -> APIRequestContext:
    """Raw API context — no authentication headers."""
    ctx = playwright.request.new_context(base_url=API_BASE)
    yield ctx
    ctx.dispose()


# ── Authentication tokens ───────────────────────────────────────────────


@pytest.fixture(scope="session")
def admin_token(api: APIRequestContext) -> str:
    """Login as admin@test.com and return access token."""
    resp = api.post("/api/v1/auth/login", data={
        "email": "admin@test.com",
        "password": "testpassword123",
        "organization_slug": "test-org",
    })
    assert resp.ok, f"Admin login failed: {resp.status} — {resp.text()}"
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def member_token(api: APIRequestContext) -> str:
    """Login as member@test.com and return access token."""
    resp = api.post("/api/v1/auth/login", data={
        "email": "member@test.com",
        "password": "testpassword123",
        "organization_slug": "test-org",
    })
    assert resp.ok, f"Member login failed: {resp.status} — {resp.text()}"
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def other_org_token(api: APIRequestContext) -> str:
    """Login as admin@other.com (different org) for multi-tenancy tests."""
    resp = api.post("/api/v1/auth/login", data={
        "email": "admin@other.com",
        "password": "testpassword123",
        "organization_slug": "other-org",
    })
    assert resp.ok, f"Other org login failed: {resp.status} — {resp.text()}"
    return resp.json()["access_token"]


# ── Authenticated API contexts ───────────────────────────────────────────


@pytest.fixture(scope="session")
def admin_api(playwright: Playwright, admin_token: str) -> APIRequestContext:
    """Authenticated API context for admin@test.com (ADMIN role)."""
    ctx = playwright.request.new_context(
        base_url=API_BASE,
        extra_http_headers={"Authorization": f"Bearer {admin_token}"},
    )
    yield ctx
    ctx.dispose()


@pytest.fixture(scope="session")
def member_api(playwright: Playwright, member_token: str) -> APIRequestContext:
    """Authenticated API context for member@test.com (MEMBER role)."""
    ctx = playwright.request.new_context(
        base_url=API_BASE,
        extra_http_headers={"Authorization": f"Bearer {member_token}"},
    )
    yield ctx
    ctx.dispose()


@pytest.fixture(scope="session")
def other_org_api(playwright: Playwright, other_org_token: str) -> APIRequestContext:
    """Authenticated API context for admin@other.com (different org)."""
    ctx = playwright.request.new_context(
        base_url=API_BASE,
        extra_http_headers={"Authorization": f"Bearer {other_org_token}"},
    )
    yield ctx
    ctx.dispose()


# ── Mock server URL ──────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def mock_url() -> str:
    """Mock server URL as seen from the API container (docker network)."""
    return os.getenv("MOCK_SERVER_INTERNAL_URL", "http://mock-server:9999")


@pytest.fixture(scope="session")
def mock_url_external() -> str:
    """Mock server URL accessible from the test runner (host network)."""
    return MOCK_BASE


# ── Reset mock server state between test modules ────────────────────────


@pytest.fixture(autouse=True, scope="module")
def reset_mock_server():
    """Reset mock server counters before each test module."""
    import urllib.request
    import json
    try:
        req = urllib.request.Request(f"{MOCK_BASE}/admin/reset", method="POST",
                                     data=b"{}", headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass  # Mock server might not be running for non-pipeline tests
    yield


# ── Shared test endpoint (created once per session) ──────────────────────


@pytest.fixture(scope="session")
def test_endpoint(admin_api: APIRequestContext, mock_url: str) -> dict:
    """Create a shared healthy endpoint pointing to mock server."""
    resp = admin_api.post("/api/v1/endpoints", data={
        "name": "E2E Healthy Endpoint",
        "url": f"{mock_url}/api/healthy",
        "method": "GET",
        "expected_status": 200,
        "monitoring_interval_seconds": 300,
        "expected_schema": {"status": "string", "timestamp": "string", "uptime": "number", "version": "string"},
    })
    assert resp.ok, f"Failed to create test endpoint: {resp.status} — {resp.text()}"
    return resp.json()


@pytest.fixture(scope="session")
def failing_endpoint(admin_api: APIRequestContext, mock_url: str) -> dict:
    """Create an endpoint pointing to mock server failing route."""
    resp = admin_api.post("/api/v1/endpoints", data={
        "name": "E2E Failing Endpoint",
        "url": f"{mock_url}/api/failing",
        "method": "GET",
        "expected_status": 200,
        "monitoring_interval_seconds": 300,
    })
    assert resp.ok, f"Failed to create failing endpoint: {resp.status} — {resp.text()}"
    return resp.json()


@pytest.fixture(scope="session")
def credential_leak_endpoint(admin_api: APIRequestContext, mock_url: str) -> dict:
    """Create an endpoint pointing to mock server credential-leak route."""
    resp = admin_api.post("/api/v1/endpoints", data={
        "name": "E2E Credential Leak Endpoint",
        "url": f"{mock_url}/api/credential-leak",
        "method": "GET",
        "expected_status": 200,
        "monitoring_interval_seconds": 300,
    })
    assert resp.ok, f"Failed to create credential leak endpoint: {resp.status} — {resp.text()}"
    return resp.json()
