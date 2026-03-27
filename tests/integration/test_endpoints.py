"""Endpoint CRUD tests -- create, read, update, delete API endpoints."""
import pytest

from .factories import endpoint_payload

pytestmark = [pytest.mark.smoke, pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    """Create an endpoint and return its JSON response."""
    payload = endpoint_payload()
    r = await client.post("/api/v1/endpoints/", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Create ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_endpoint(client, owner_headers):
    """POST /api/v1/endpoints/ creates a new endpoint (201)."""
    payload = endpoint_payload(name="Health Check API")
    response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Health Check API"
    assert data["method"] == "GET"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_endpoint_missing_name(client, owner_headers):
    """POST /api/v1/endpoints/ with missing name returns 422."""
    payload = {"url": "https://example.com", "method": "GET"}
    response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_endpoint_invalid_url(client, owner_headers):
    """POST with an invalid URL format returns 422."""
    payload = endpoint_payload(url="not-a-url")
    response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)
    assert response.status_code == 422


# ── List ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_endpoints(client, owner_headers):
    """GET /api/v1/endpoints/ returns a list."""
    await _create_endpoint(client, owner_headers)
    response = await client.get("/api/v1/endpoints/", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ── Get by ID ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_endpoint_by_id(client, owner_headers):
    """GET /api/v1/endpoints/{id} returns endpoint details."""
    ep = await _create_endpoint(client, owner_headers)
    response = await client.get(f"/api/v1/endpoints/{ep['id']}", headers=owner_headers)
    assert response.status_code == 200
    assert response.json()["id"] == ep["id"]


@pytest.mark.asyncio
async def test_get_nonexistent_endpoint(client, owner_headers):
    """GET /api/v1/endpoints/{bad_id} returns 404."""
    import uuid
    bad_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/endpoints/{bad_id}", headers=owner_headers)
    assert response.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_endpoint(client, owner_headers):
    """PATCH /api/v1/endpoints/{id} updates fields."""
    ep = await _create_endpoint(client, owner_headers)
    update = {"name": "Updated Name"}
    response = await client.patch(
        f"/api/v1/endpoints/{ep['id']}", json=update, headers=owner_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


# ── Delete ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_endpoint(client, owner_headers):
    """DELETE /api/v1/endpoints/{id} returns 204."""
    ep = await _create_endpoint(client, owner_headers)
    response = await client.delete(
        f"/api/v1/endpoints/{ep['id']}", headers=owner_headers
    )
    assert response.status_code == 204

    # Verify it is gone
    get_r = await client.get(f"/api/v1/endpoints/{ep['id']}", headers=owner_headers)
    assert get_r.status_code == 404


# ── RBAC ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_viewer_cannot_create_endpoint(client, viewer_headers):
    """VIEWER role cannot POST endpoints (403)."""
    payload = endpoint_payload()
    response = await client.post("/api/v1/endpoints/", json=payload, headers=viewer_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_member_can_create_endpoint(client, member_headers):
    """MEMBER role CAN create endpoints (201)."""
    payload = endpoint_payload()
    response = await client.post("/api/v1/endpoints/", json=payload, headers=member_headers)
    assert response.status_code == 201
