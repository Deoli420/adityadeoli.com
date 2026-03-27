"""Dashboard aggregate stats and chart endpoint tests."""
import pytest

from .factories import endpoint_payload

pytestmark = [pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Stats ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dashboard_stats(client, owner_headers):
    """GET /api/v1/dashboard/stats returns aggregate KPIs."""
    # Seed at least one endpoint so the query has data
    await _create_endpoint(client, owner_headers)

    response = await client.get("/api/v1/dashboard/stats", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_endpoints" in data
    assert "anomalies_24h" in data
    assert "avg_risk_score" in data
    assert data["total_endpoints"] >= 1


@pytest.mark.asyncio
async def test_dashboard_stats_empty_org(client, owner_headers):
    """Dashboard stats for an org with no endpoints returns zeroes."""
    response = await client.get("/api/v1/dashboard/stats", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["anomalies_24h"] == 0


# ── Response Trends (uses date_trunc -- PG-only) ─────────────────────────


@pytest.mark.asyncio
@pytest.mark.skip(reason="pg-only: date_trunc not available in SQLite")
async def test_response_trends(client, owner_headers):
    """GET /api/v1/dashboard/response-trends returns trend points."""
    response = await client.get("/api/v1/dashboard/response-trends", headers=owner_headers)
    assert response.status_code == 200


# ── Top Failures ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_top_failures_empty(client, owner_headers):
    """Top failures returns empty list when no runs exist."""
    response = await client.get("/api/v1/dashboard/top-failures", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "endpoints" in data
    assert isinstance(data["endpoints"], list)


# ── Risk Distribution ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_risk_distribution(client, owner_headers):
    """GET /api/v1/dashboard/risk-distribution returns per-level counts."""
    response = await client.get("/api/v1/dashboard/risk-distribution", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    for level in ("low", "medium", "high", "critical"):
        assert level in data


# ── Uptime Overview ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_uptime_overview_empty(client, owner_headers):
    """Uptime overview returns empty entries when no SLAs configured."""
    response = await client.get("/api/v1/dashboard/uptime-overview", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "entries" in data
    assert isinstance(data["entries"], list)


# ── Feature Summary ───────────────────────────────────────────────────────


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
