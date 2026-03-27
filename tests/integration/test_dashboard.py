"""Dashboard aggregate stats and chart endpoint tests."""
import allure
import pytest

from .factories import endpoint_payload

pytestmark = [pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Stats ─────────────────────────────────────────────────────────────────


@allure.feature("Dashboard")
@allure.story("Dashboard stats returns aggregate KPIs")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /dashboard/stats returns aggregate KPIs")
@pytest.mark.asyncio
async def test_dashboard_stats(client, owner_headers):
    """GET /api/v1/dashboard/stats returns aggregate KPIs."""
    with allure.step("Arrange: seed at least one endpoint"):
        await _create_endpoint(client, owner_headers)

    with allure.step("Act: GET /dashboard/stats"):
        response = await client.get("/api/v1/dashboard/stats", headers=owner_headers)

    with allure.step("Assert: verify KPI fields"):
        assert response.status_code == 200
        data = response.json()
        assert "total_endpoints" in data
        assert "anomalies_24h" in data
        assert "avg_risk_score" in data
        assert data["total_endpoints"] >= 1


@allure.feature("Dashboard")
@allure.story("Dashboard stats for empty org returns zeroes")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Dashboard stats for org with no endpoints returns zeroes")
@pytest.mark.asyncio
async def test_dashboard_stats_empty_org(client, owner_headers):
    """Dashboard stats for an org with no endpoints returns zeroes."""
    response = await client.get("/api/v1/dashboard/stats", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["anomalies_24h"] == 0


# ── Response Trends (uses date_trunc -- PG-only) ─────────────────────────


@allure.feature("Dashboard")
@allure.story("Response trends returns trend points")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /dashboard/response-trends returns trend points")
@pytest.mark.asyncio
@pytest.mark.skip(reason="pg-only: date_trunc not available in SQLite")
async def test_response_trends(client, owner_headers):
    """GET /api/v1/dashboard/response-trends returns trend points."""
    response = await client.get("/api/v1/dashboard/response-trends", headers=owner_headers)
    assert response.status_code == 200


# ── Top Failures ──────────────────────────────────────────────────────────


@allure.feature("Dashboard")
@allure.story("Top failures returns empty list when no runs exist")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Top failures returns empty list when no runs exist")
@pytest.mark.asyncio
async def test_top_failures_empty(client, owner_headers):
    """Top failures returns empty list when no runs exist."""
    response = await client.get("/api/v1/dashboard/top-failures", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data
    assert isinstance(data["endpoints"], list)


# ── Risk Distribution ────────────────────────────────────────────────────


@allure.feature("Dashboard")
@allure.story("Risk distribution returns per-level counts")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /dashboard/risk-distribution returns per-level counts")
@pytest.mark.asyncio
async def test_risk_distribution(client, owner_headers):
    """GET /api/v1/dashboard/risk-distribution returns per-level counts."""
    response = await client.get("/api/v1/dashboard/risk-distribution", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    for level in ("low", "medium", "high", "critical"):
        assert level in data


# ── Uptime Overview ───────────────────────────────────────────────────────


@allure.feature("Dashboard")
@allure.story("Uptime overview returns empty entries when no SLAs configured")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Uptime overview returns empty entries when no SLAs configured")
@pytest.mark.asyncio
async def test_uptime_overview_empty(client, owner_headers):
    """Uptime overview returns empty entries when no SLAs configured."""
    response = await client.get("/api/v1/dashboard/uptime-overview", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "entries" in data
    assert isinstance(data["entries"], list)


# ── Feature Summary ───────────────────────────────────────────────────────


@allure.feature("Dashboard")
@allure.story("Feature summary returns feature counts")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /dashboard/feature-summary returns feature counts")
@pytest.mark.asyncio
async def test_feature_summary(client, owner_headers):
    """GET /api/v1/dashboard/feature-summary returns feature counts."""
    response = await client.get("/api/v1/dashboard/feature-summary", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "security_findings_24h" in data
    assert "schema_drifts_24h" in data
    assert "ai_analyses_24h" in data
    assert "high_risk_endpoints" in data
