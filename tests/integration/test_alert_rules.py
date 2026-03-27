"""Alert rule CRUD + toggle tests."""
import pytest

from .factories import alert_rule_payload, endpoint_payload

pytestmark = [pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


async def _create_rule(client, headers, endpoint_id: str, **overrides) -> dict:
    payload = alert_rule_payload(endpoint_id, **overrides)
    r = await client.post("/api/v1/alert-rules/", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Create ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_alert_rule(client, owner_headers):
    """POST /api/v1/alert-rules/ creates a new alert rule."""
    ep = await _create_endpoint(client, owner_headers)
    rule = await _create_rule(client, owner_headers, ep["id"])
    assert rule["endpoint_id"] == ep["id"]
    assert rule["condition_type"] == "LATENCY_ABOVE"
    assert rule["threshold"] == 1000.0
    assert rule["is_active"] is True


# ── List ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_alert_rules(client, owner_headers):
    """GET /api/v1/alert-rules/endpoint/{id} returns rules for an endpoint."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_rule(client, owner_headers, ep["id"])

    response = await client.get(
        f"/api/v1/alert-rules/endpoint/{ep['id']}", headers=owner_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ── Update ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_alert_rule(client, owner_headers):
    """PATCH /api/v1/alert-rules/{id} updates rule fields."""
    ep = await _create_endpoint(client, owner_headers)
    rule = await _create_rule(client, owner_headers, ep["id"])

    response = await client.patch(
        f"/api/v1/alert-rules/{rule['id']}",
        json={"name": "Updated Rule", "threshold": 2000.0},
        headers=owner_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Rule"
    assert data["threshold"] == 2000.0


# ── Delete ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_alert_rule(client, owner_headers):
    """DELETE /api/v1/alert-rules/{id} returns 204."""
    ep = await _create_endpoint(client, owner_headers)
    rule = await _create_rule(client, owner_headers, ep["id"])

    response = await client.delete(
        f"/api/v1/alert-rules/{rule['id']}", headers=owner_headers
    )
    assert response.status_code == 204


# ── Toggle ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_toggle_alert_rule(client, owner_headers):
    """POST /api/v1/alert-rules/{id}/toggle flips is_active."""
    ep = await _create_endpoint(client, owner_headers)
    rule = await _create_rule(client, owner_headers, ep["id"])
    assert rule["is_active"] is True

    response = await client.post(
        f"/api/v1/alert-rules/{rule['id']}/toggle", headers=owner_headers
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    # Toggle back
    response2 = await client.post(
        f"/api/v1/alert-rules/{rule['id']}/toggle", headers=owner_headers
    )
    assert response2.status_code == 200
    assert response2.json()["is_active"] is True
