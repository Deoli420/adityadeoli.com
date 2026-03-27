"""Health check tests -- verifies the API is alive and responsive."""
import pytest

pytestmark = [pytest.mark.smoke]


@pytest.mark.asyncio
async def test_health_endpoint(client):
    """GET /api/v1/health returns 200 with status ok."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_health_database_field(client):
    """Health check reports database connectivity status."""
    response = await client.get("/api/v1/health")
    data = response.json()
    assert "database" in data
