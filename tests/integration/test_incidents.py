"""Incident CRUD tests -- create, list, update status, add notes, timeline."""
import allure
import pytest

from .factories import endpoint_payload, incident_payload

pytestmark = [pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


async def _create_incident(client, headers, endpoint_id: str, **overrides) -> dict:
    payload = incident_payload(endpoint_id, **overrides)
    r = await client.post("/api/v1/incidents/", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Create ────────────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("Create a new incident")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /incidents/ creates a new incident (201)")
@pytest.mark.asyncio
async def test_create_incident(client, owner_headers):
    """POST /api/v1/incidents/ creates a new incident (201)."""
    with allure.step("Arrange: create endpoint"):
        ep = await _create_endpoint(client, owner_headers)

    with allure.step("Act: POST /incidents/"):
        inc = await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Assert: verify incident data"):
        assert inc["status"] == "OPEN"
        assert inc["severity"] == "MEDIUM"
        assert inc["endpoint_id"] == ep["id"]


@allure.feature("Incident Management")
@allure.story("Create incident with missing fields")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /incidents/ without required fields returns 422")
@pytest.mark.asyncio
async def test_create_incident_missing_fields(client, owner_headers):
    """POST /api/v1/incidents/ without required fields returns 422."""
    response = await client.post(
        "/api/v1/incidents/", json={"title": "Oops"}, headers=owner_headers
    )
    assert response.status_code == 422


# ── List ──────────────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("List incidents")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /incidents/ returns incident list")
@pytest.mark.asyncio
async def test_list_incidents(client, owner_headers):
    """GET /api/v1/incidents/ returns incident list."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: GET /incidents/"):
        response = await client.get("/api/v1/incidents/", headers=owner_headers)

    with allure.step("Assert: verify list response"):
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


@allure.feature("Incident Management")
@allure.story("Filter incidents by status")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /incidents/?status=OPEN filters correctly")
@pytest.mark.asyncio
async def test_list_incidents_filter_by_status(client, owner_headers):
    """GET /api/v1/incidents/?status=OPEN filters correctly."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: GET /incidents/?status=OPEN"):
        response = await client.get(
            "/api/v1/incidents/", params={"status": "OPEN"}, headers=owner_headers
        )

    with allure.step("Assert: verify all returned incidents are OPEN"):
        assert response.status_code == 200
        for inc in response.json():
            assert inc["status"] == "OPEN"


# ── Get Detail ────────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("Get incident detail by ID")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /incidents/{id} returns full incident")
@pytest.mark.asyncio
async def test_get_incident_detail(client, owner_headers):
    """GET /api/v1/incidents/{id} returns full incident."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        inc = await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: GET /incidents/{id}"):
        response = await client.get(f"/api/v1/incidents/{inc['id']}", headers=owner_headers)

    with allure.step("Assert: verify incident detail"):
        assert response.status_code == 200
        assert response.json()["id"] == inc["id"]


# ── Update Status ─────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("Update incident status to INVESTIGATING")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("PATCH status OPEN -> INVESTIGATING")
@pytest.mark.asyncio
async def test_update_incident_status_to_investigating(client, owner_headers):
    """PATCH status OPEN -> INVESTIGATING."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        inc = await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: PATCH /incidents/{id}/status"):
        response = await client.patch(
            f"/api/v1/incidents/{inc['id']}/status",
            json={"status": "INVESTIGATING"},
            headers=owner_headers,
        )

    with allure.step("Assert: verify status is INVESTIGATING"):
        assert response.status_code == 200
        assert response.json()["status"] == "INVESTIGATING"


@allure.feature("Incident Management")
@allure.story("Update incident status to RESOLVED")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("PATCH status -> RESOLVED sets resolved_at")
@pytest.mark.asyncio
async def test_update_incident_status_to_resolved(client, owner_headers):
    """PATCH status -> RESOLVED sets resolved_at."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        inc = await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: PATCH /incidents/{id}/status to RESOLVED"):
        response = await client.patch(
            f"/api/v1/incidents/{inc['id']}/status",
            json={"status": "RESOLVED"},
            headers=owner_headers,
        )

    with allure.step("Assert: verify RESOLVED status and resolved_at"):
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "RESOLVED"
        assert data["resolved_at"] is not None


# ── Notes ─────────────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("Add note to incident")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /incidents/{id}/notes adds a note")
@pytest.mark.asyncio
async def test_add_note_to_incident(client, owner_headers):
    """POST /api/v1/incidents/{id}/notes adds a note."""
    with allure.step("Arrange: create endpoint and incident"):
        ep = await _create_endpoint(client, owner_headers)
        inc = await _create_incident(client, owner_headers, ep["id"])

    with allure.step("Act: POST /incidents/{id}/notes"):
        response = await client.post(
            f"/api/v1/incidents/{inc['id']}/notes",
            json={"note": "Investigating the root cause"},
            headers=owner_headers,
        )

    with allure.step("Assert: verify note is present"):
        assert response.status_code == 200
        assert "Investigating the root cause" in response.json().get("notes", "")


# ── Timeline ──────────────────────────────────────────────────────────────


@allure.feature("Incident Management")
@allure.story("Get incident timeline events")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /incidents/{id}/timeline returns events")
@pytest.mark.asyncio
async def test_get_incident_timeline(client, owner_headers):
    """GET /api/v1/incidents/{id}/timeline returns events."""
    with allure.step("Arrange: create endpoint, incident, and status change"):
        ep = await _create_endpoint(client, owner_headers)
        inc = await _create_incident(client, owner_headers, ep["id"])
        await client.patch(
            f"/api/v1/incidents/{inc['id']}/status",
            json={"status": "INVESTIGATING"},
            headers=owner_headers,
        )

    with allure.step("Act: GET /incidents/{id}/timeline"):
        response = await client.get(
            f"/api/v1/incidents/{inc['id']}/timeline", headers=owner_headers
        )

    with allure.step("Assert: verify timeline events"):
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
