"""SLA configuration CRUD + uptime stats tests."""
import pytest

from .factories import endpoint_payload, sla_payload

pytestmark = [pytest.mark.regression]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


async def _create_sla(client, headers, endpoint_id: str, **overrides) -> dict:
    payload = sla_payload(endpoint_id, **overrides)
    r = await client.post("/api/v1/sla/", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── Create ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_sla(client, owner_headers):
    """POST /api/v1/sla/ creates an SLA configuration."""
    ep = await _create_endpoint(client, owner_headers)
    sla = await _create_sla(client, owner_headers, ep["id"])
    assert sla["endpoint_id"] == ep["id"]
    assert sla["sla_target_percent"] == 99.9
    assert sla["uptime_window"] == "24h"
    assert sla["is_active"] is True


# ── Get ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_sla(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id} returns the SLA config."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_sla(client, owner_headers, ep["id"])

    response = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
    assert response.status_code == 200
    assert response.json()["endpoint_id"] == ep["id"]


@pytest.mark.asyncio
async def test_get_sla_not_found(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id} without SLA returns 404."""
    ep = await _create_endpoint(client, owner_headers)
    response = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
    assert response.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_sla(client, owner_headers):
    """PATCH /api/v1/sla/{endpoint_id} updates SLA fields."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_sla(client, owner_headers, ep["id"])

    response = await client.patch(
        f"/api/v1/sla/{ep['id']}",
        json={"sla_target_percent": 99.5, "uptime_window": "7d"},
        headers=owner_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sla_target_percent"] == 99.5
    assert data["uptime_window"] == "7d"


# ── Delete ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_sla(client, owner_headers):
    """DELETE /api/v1/sla/{endpoint_id} returns 204."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_sla(client, owner_headers, ep["id"])

    response = await client.delete(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
    assert response.status_code == 204

    # Confirm it is gone
    get_r = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
    assert get_r.status_code == 404


# ── Uptime Stats ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_uptime_stats(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id}/uptime returns uptime statistics."""
    ep = await _create_endpoint(client, owner_headers)
    await _create_sla(client, owner_headers, ep["id"])

    response = await client.get(f"/api/v1/sla/{ep['id']}/uptime", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert "uptime_percent" in data
    assert "total_runs" in data
    assert "is_breached" in data
