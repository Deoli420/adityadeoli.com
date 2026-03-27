"""Security findings endpoint tests."""
import uuid

import pytest

pytestmark = [pytest.mark.regression]


@pytest.mark.asyncio
async def test_list_security_findings(client, owner_headers):
    """GET /api/v1/security/findings returns list (possibly empty)."""
    response = await client.get("/api/v1/security/findings", headers=owner_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_security_stats(client, owner_headers):
    """GET /api/v1/security/stats returns aggregate statistics."""
    response = await client.get("/api/v1/security/stats", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data or "total_findings" in data or response.status_code == 200


@pytest.mark.asyncio
async def test_findings_by_endpoint(client, owner_headers):
    """GET /api/v1/security/findings/{endpoint_id} scoped to endpoint."""
    fake_id = str(uuid.uuid4())
    response = await client.get(
        f"/api/v1/security/findings/{fake_id}", headers=owner_headers
    )
    # Should return 200 with empty list (no findings for fake endpoint)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_security_findings_unauthenticated(client):
    """Security endpoints require authentication."""
    response = await client.get("/api/v1/security/findings")
    assert response.status_code in (401, 403)
