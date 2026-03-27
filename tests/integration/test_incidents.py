"""Incident CRUD tests -- create, list, update status, add notes, timeline."""
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


@pytest.mark.asyncio
async def test_create_incident(client, owner_headers):
    """POST /api/v1/incidents/ creates a new incident (201)."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])
    assert inc["status"] == "OPEN"
    assert inc["severity"] == "MEDIUM"
    assert inc["endpoint_id"] == ep["id"]


@pytest.mark.asyncio
async def test_create_incident_missing_fields(client, owner_headers):
    """POST /api/v1/incidents/ without required fields returns 422."""
    response = await client.post(
        "/api/v1/incidents/", json={"title": "Oops"}, headers=owner_headers
    )
    assert response.status_code == 422


# ── List ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_incidents(client, owner_headers):
    """GET /api/v1/incidents/ returns incident list."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_incident(client, owner_headers, ep["id"])

    response = await client.get("/api/v1/incidents/", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_incidents_filter_by_status(client, owner_headers):
    """GET /api/v1/incidents/?status=OPEN filters correctly."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_incident(client, owner_headers, ep["id"])

    response = await client.get(
        "/api/v1/incidents/", params={"status": "OPEN"}, headers=owner_headers
    )
    assert response.status_code == 200
    for inc in response.json():
        assert inc["status"] == "OPEN"


# ── Get Detail ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_incident_detail(client, owner_headers):
    """GET /api/v1/incidents/{id} returns full incident."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])

    response = await client.get(f"/api/v1/incidents/{inc['id']}", headers=owner_headers)
    assert response.status_code == 200
    assert response.json()["id"] == inc["id"]


# ── Update Status ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_incident_status_to_investigating(client, owner_headers):
    """PATCH status OPEN -> INVESTIGATING."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])

    response = await client.patch(
        f"/api/v1/incidents/{inc['id']}/status",
        json={"status": "INVESTIGATING"},
        headers=owner_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "INVESTIGATING"


@pytest.mark.asyncio
async def test_update_incident_status_to_resolved(client, owner_headers):
    """PATCH status -> RESOLVED sets resolved_at."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])

    response = await client.patch(
        f"/api/v1/incidents/{inc['id']}/status",
        json={"status": "RESOLVED"},
        headers=owner_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None


# ── Notes ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_note_to_incident(client, owner_headers):
    """POST /api/v1/incidents/{id}/notes adds a note."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])

    response = await client.post(
        f"/api/v1/incidents/{inc['id']}/notes",
        json={"note": "Investigating the root cause"},
        headers=owner_headers,
    )
    assert response.status_code == 200
    assert "Investigating the root cause" in response.json().get("notes", "")


# ── Timeline ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_incident_timeline(client, owner_headers):
    """GET /api/v1/incidents/{id}/timeline returns events."""
    ep = await _create_endpoint(client, owner_headers)
    inc = await _create_incident(client, owner_headers, ep["id"])

    # Generate at least one event by changing status
    await client.patch(
        f"/api/v1/incidents/{inc['id']}/status",
        json={"status": "INVESTIGATING"},
        headers=owner_headers,
    )

    response = await client.get(
        f"/api/v1/incidents/{inc['id']}/timeline", headers=owner_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should have at least the CREATED and STATUS_CHANGE events
    assert len(data) >= 1
