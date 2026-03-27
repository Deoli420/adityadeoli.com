"""Export CSV endpoint tests."""
import pytest

pytestmark = [pytest.mark.regression]


@pytest.mark.asyncio
async def test_export_runs_csv(client, owner_headers):
    """GET /api/v1/export/runs returns CSV streaming response."""
    response = await client.get("/api/v1/export/runs", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_export_incidents_csv(client, owner_headers):
    """GET /api/v1/export/incidents returns CSV streaming response."""
    response = await client.get("/api/v1/export/incidents", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_export_risk_scores_csv(client, owner_headers):
    """GET /api/v1/export/risk-scores returns CSV streaming response."""
    response = await client.get("/api/v1/export/risk-scores", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_export_sla_csv(client, owner_headers):
    """GET /api/v1/export/sla returns CSV streaming response."""
    response = await client.get("/api/v1/export/sla", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_export_unauthenticated(client):
    """Export endpoints require authentication."""
    response = await client.get("/api/v1/export/runs")
    assert response.status_code in (401, 403)
