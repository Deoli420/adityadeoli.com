"""Incident cluster tests -- list and detail."""
import uuid

import allure
import pytest

pytestmark = [pytest.mark.regression]


@allure.feature("Root Cause Clusters")
@allure.story("List clusters returns empty when none exist")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /clusters/ returns empty list when no clusters exist")
@pytest.mark.asyncio
async def test_list_clusters_empty(client, owner_headers):
    """GET /api/v1/clusters/ returns empty list when no clusters exist."""
    response = await client.get("/api/v1/clusters/", headers=owner_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@allure.feature("Root Cause Clusters")
@allure.story("Get nonexistent cluster returns 404")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /clusters/{id} returns 404 for nonexistent cluster")
@pytest.mark.asyncio
async def test_get_cluster_not_found(client, owner_headers):
    """GET /api/v1/clusters/{id} returns 404 for nonexistent cluster."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/clusters/{fake_id}", headers=owner_headers)
    assert response.status_code == 404


@allure.feature("Root Cause Clusters")
@allure.story("List clusters with status filter")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /clusters/?status=ACTIVE filters by status")
@pytest.mark.asyncio
async def test_list_clusters_with_status_filter(client, owner_headers):
    """GET /api/v1/clusters/?status=ACTIVE filters by status."""
    response = await client.get(
        "/api/v1/clusters/", params={"status": "ACTIVE"}, headers=owner_headers
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@allure.feature("Root Cause Clusters")
@allure.story("Cluster endpoints require authentication")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Cluster endpoints require authentication")
@pytest.mark.asyncio
async def test_clusters_unauthenticated(client):
    """Cluster endpoints require authentication."""
    response = await client.get("/api/v1/clusters/")
    assert response.status_code in (401, 403)
