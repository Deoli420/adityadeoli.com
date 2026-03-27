"""Export CSV endpoint tests."""
import allure
import pytest

pytestmark = [pytest.mark.regression]


@allure.feature("Data Export")
@allure.story("Export runs as CSV")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /export/runs returns CSV streaming response")
@pytest.mark.asyncio
async def test_export_runs_csv(client, owner_headers):
    """GET /api/v1/export/runs returns CSV streaming response."""
    response = await client.get("/api/v1/export/runs", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")


@allure.feature("Data Export")
@allure.story("Export incidents as CSV")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /export/incidents returns CSV streaming response")
@pytest.mark.asyncio
async def test_export_incidents_csv(client, owner_headers):
    """GET /api/v1/export/incidents returns CSV streaming response."""
    response = await client.get("/api/v1/export/incidents", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@allure.feature("Data Export")
@allure.story("Export risk scores as CSV")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /export/risk-scores returns CSV streaming response")
@pytest.mark.asyncio
async def test_export_risk_scores_csv(client, owner_headers):
    """GET /api/v1/export/risk-scores returns CSV streaming response."""
    response = await client.get("/api/v1/export/risk-scores", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@allure.feature("Data Export")
@allure.story("Export SLA data as CSV")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /export/sla returns CSV streaming response")
@pytest.mark.asyncio
async def test_export_sla_csv(client, owner_headers):
    """GET /api/v1/export/sla returns CSV streaming response."""
    response = await client.get("/api/v1/export/sla", headers=owner_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


@allure.feature("Data Export")
@allure.story("Export endpoints require authentication")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Export endpoints require authentication")
@pytest.mark.asyncio
async def test_export_unauthenticated(client):
    """Export endpoints require authentication."""
    response = await client.get("/api/v1/export/runs")
    assert response.status_code in (401, 403)
