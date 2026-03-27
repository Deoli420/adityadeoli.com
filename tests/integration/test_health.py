"""Health check tests -- verifies the API is alive and responsive."""
import allure
import pytest

pytestmark = [pytest.mark.smoke]


@allure.feature("Health")
@allure.story("Health check returns 200 with status ok")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("GET /health returns 200 with status ok and version info")
@pytest.mark.asyncio
async def test_health_endpoint(client):
    """GET /api/v1/health returns 200 with status ok."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "version" in data


@allure.feature("Health")
@allure.story("Health check reports database connectivity")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("GET /health includes database connectivity status")
@pytest.mark.asyncio
async def test_health_database_field(client):
    """Health check reports database connectivity status."""
    response = await client.get("/api/v1/health")
    data = response.json()
    assert "database" in data
