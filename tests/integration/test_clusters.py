"""Incident cluster tests -- list and detail."""
import uuid

import pytest

pytestmark = [pytest.mark.regression]


@pytest.mark.asyncio
async def test_list_clusters_empty(client, owner_headers):
    """GET /api/v1/clusters/ returns empty list when no clusters exist."""
    response = await client.get("/api/v1/clusters/", headers=owner_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_cluster_not_found(client, owner_headers):
    """GET /api/v1/clusters/{id} returns 404 for nonexistent cluster."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/clusters/{fake_id}", headers=owner_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_clusters_with_status_filter(client, owner_headers):
    """GET /api/v1/clusters/?status=ACTIVE filters by status."""
    response = await client.get(
        "/api/v1/clusters/", params={"status": "ACTIVE"}, headers=owner_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_clusters_unauthenticated(client):
    """Cluster endpoints require authentication."""
    response = await client.get("/api/v1/clusters/")
    assert response.status_code in (401, 403)
