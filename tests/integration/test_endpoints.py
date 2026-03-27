"""Endpoint CRUD tests -- create, read, update, delete API endpoints."""
import allure
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


@allure.feature("Endpoint Management")
@allure.story("Create a new endpoint")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("POST /endpoints/ creates a new endpoint (201)")
@pytest.mark.asyncio
async def test_create_endpoint(client, owner_headers):
    """POST /api/v1/endpoints/ creates a new endpoint (201)."""
    with allure.step("Arrange: prepare endpoint payload"):
        payload = endpoint_payload(name="Health Check API")

    with allure.step("Act: POST /endpoints/"):
        response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)

    with allure.step("Assert: verify 201 and response data"):
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Health Check API"
        assert data["method"] == "GET"
        assert "id" in data


@allure.feature("Endpoint Management")
@allure.story("Create endpoint with missing name")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /endpoints/ with missing name returns 422")
@pytest.mark.asyncio
async def test_create_endpoint_missing_name(client, owner_headers):
    """POST /api/v1/endpoints/ with missing name returns 422."""
    payload = {"url": "https://example.com", "method": "GET"}
    response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)
    assert response.status_code == 422


@allure.feature("Endpoint Management")
@allure.story("Create endpoint with invalid URL")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /endpoints/ with invalid URL format returns 422")
@pytest.mark.asyncio
async def test_create_endpoint_invalid_url(client, owner_headers):
    """POST with an invalid URL format returns 422."""
    payload = endpoint_payload(url="not-a-url")
    response = await client.post("/api/v1/endpoints/", json=payload, headers=owner_headers)
    assert response.status_code == 422


# ── List ──────────────────────────────────────────────────────────────────


@allure.feature("Endpoint Management")
@allure.story("List endpoints")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("GET /endpoints/ returns a list of endpoints")
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


@allure.feature("Endpoint Management")
@allure.story("Get endpoint by ID")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("GET /endpoints/{id} returns endpoint details")
@pytest.mark.asyncio
async def test_get_endpoint_by_id(client, owner_headers):
    """GET /api/v1/endpoints/{id} returns endpoint details."""
    ep = await _create_endpoint(client, owner_headers)
    response = await client.get(f"/api/v1/endpoints/{ep['id']}", headers=owner_headers)
    assert response.status_code == 200
    assert response.json()["id"] == ep["id"]


@allure.feature("Endpoint Management")
@allure.story("Get nonexistent endpoint returns 404")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /endpoints/{bad_id} returns 404")
@pytest.mark.asyncio
async def test_get_nonexistent_endpoint(client, owner_headers):
    """GET /api/v1/endpoints/{bad_id} returns 404."""
    import uuid
    bad_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/endpoints/{bad_id}", headers=owner_headers)
    assert response.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────


@allure.feature("Endpoint Management")
@allure.story("Update endpoint fields")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("PATCH /endpoints/{id} updates fields")
@pytest.mark.asyncio
async def test_update_endpoint(client, owner_headers):
    """PATCH /api/v1/endpoints/{id} updates fields."""
    with allure.step("Arrange: create endpoint"):
        ep = await _create_endpoint(client, owner_headers)
        update = {"name": "Updated Name"}

    with allure.step("Act: PATCH /endpoints/{id}"):
        response = await client.patch(
            f"/api/v1/endpoints/{ep['id']}", json=update, headers=owner_headers
        )

    with allure.step("Assert: verify 200 and updated name"):
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"


# ── Delete ────────────────────────────────────────────────────────────────


@allure.feature("Endpoint Management")
@allure.story("Delete endpoint")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("DELETE /endpoints/{id} returns 204 and removes endpoint")
@pytest.mark.asyncio
async def test_delete_endpoint(client, owner_headers):
    """DELETE /api/v1/endpoints/{id} returns 204."""
    with allure.step("Arrange: create endpoint"):
        ep = await _create_endpoint(client, owner_headers)

    with allure.step("Act: DELETE /endpoints/{id}"):
        response = await client.delete(
            f"/api/v1/endpoints/{ep['id']}", headers=owner_headers
        )

    with allure.step("Assert: verify 204 and endpoint is gone"):
        assert response.status_code == 204
        get_r = await client.get(f"/api/v1/endpoints/{ep['id']}", headers=owner_headers)
        assert get_r.status_code == 404


# ── RBAC ──────────────────────────────────────────────────────────────────


@allure.feature("Endpoint Management")
@allure.story("VIEWER cannot create endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("VIEWER role cannot POST endpoints (403)")
@pytest.mark.asyncio
async def test_viewer_cannot_create_endpoint(client, viewer_headers):
    """VIEWER role cannot POST endpoints (403)."""
    payload = endpoint_payload()
    response = await client.post("/api/v1/endpoints/", json=payload, headers=viewer_headers)
    assert response.status_code == 403


@allure.feature("Endpoint Management")
@allure.story("MEMBER can create endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("MEMBER role CAN create endpoints (201)")
@pytest.mark.asyncio
async def test_member_can_create_endpoint(client, member_headers):
    """MEMBER role CAN create endpoints (201)."""
    payload = endpoint_payload()
    response = await client.post("/api/v1/endpoints/", json=payload, headers=member_headers)
    assert response.status_code == 201
