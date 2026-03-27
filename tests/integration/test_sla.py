"""SLA configuration CRUD + uptime stats tests."""
import allure
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


@allure.feature("SLA Management")
@allure.story("Create SLA configuration")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /sla/ creates an SLA configuration")
@pytest.mark.asyncio
async def test_create_sla(client, owner_headers):
    """POST /api/v1/sla/ creates an SLA configuration."""
    with allure.step("Arrange: create endpoint"):
        ep = await _create_endpoint(client, owner_headers)

    with allure.step("Act: POST /sla/"):
        sla = await _create_sla(client, owner_headers, ep["id"])

    with allure.step("Assert: verify SLA data"):
        assert sla["endpoint_id"] == ep["id"]
        assert sla["sla_target_percent"] == 99.9
        assert sla["uptime_window"] == "24h"
        assert sla["is_active"] is True


# ── Get ───────────────────────────────────────────────────────────────────


@allure.feature("SLA Management")
@allure.story("Get SLA by endpoint ID")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /sla/{endpoint_id} returns the SLA config")
@pytest.mark.asyncio
async def test_get_sla(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id} returns the SLA config."""
    with allure.step("Arrange: create endpoint and SLA"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_sla(client, owner_headers, ep["id"])

    with allure.step("Act: GET /sla/{endpoint_id}"):
        response = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)

    with allure.step("Assert: verify SLA response"):
        assert response.status_code == 200
        assert response.json()["endpoint_id"] == ep["id"]


@allure.feature("SLA Management")
@allure.story("Get SLA returns 404 when not configured")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /sla/{endpoint_id} without SLA returns 404")
@pytest.mark.asyncio
async def test_get_sla_not_found(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id} without SLA returns 404."""
    ep = await _create_endpoint(client, owner_headers)
    response = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
    assert response.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────


@allure.feature("SLA Management")
@allure.story("Update SLA fields")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("PATCH /sla/{endpoint_id} updates SLA fields")
@pytest.mark.asyncio
async def test_update_sla(client, owner_headers):
    """PATCH /api/v1/sla/{endpoint_id} updates SLA fields."""
    with allure.step("Arrange: create endpoint and SLA"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_sla(client, owner_headers, ep["id"])

    with allure.step("Act: PATCH /sla/{endpoint_id}"):
        response = await client.patch(
            f"/api/v1/sla/{ep['id']}",
            json={"sla_target_percent": 99.5, "uptime_window": "7d"},
            headers=owner_headers,
        )

    with allure.step("Assert: verify updated fields"):
        assert response.status_code == 200
        data = response.json()
        assert data["sla_target_percent"] == 99.5
        assert data["uptime_window"] == "7d"


# ── Delete ────────────────────────────────────────────────────────────────


@allure.feature("SLA Management")
@allure.story("Delete SLA configuration")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("DELETE /sla/{endpoint_id} returns 204 and removes SLA")
@pytest.mark.asyncio
async def test_delete_sla(client, owner_headers):
    """DELETE /api/v1/sla/{endpoint_id} returns 204."""
    with allure.step("Arrange: create endpoint and SLA"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_sla(client, owner_headers, ep["id"])

    with allure.step("Act: DELETE /sla/{endpoint_id}"):
        response = await client.delete(f"/api/v1/sla/{ep['id']}", headers=owner_headers)

    with allure.step("Assert: verify 204 and SLA is gone"):
        assert response.status_code == 204
        get_r = await client.get(f"/api/v1/sla/{ep['id']}", headers=owner_headers)
        assert get_r.status_code == 404


# ── Uptime Stats ──────────────────────────────────────────────────────────


@allure.feature("SLA Management")
@allure.story("Uptime stats returns uptime statistics")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /sla/{endpoint_id}/uptime returns uptime statistics")
@pytest.mark.asyncio
async def test_uptime_stats(client, owner_headers):
    """GET /api/v1/sla/{endpoint_id}/uptime returns uptime statistics."""
    with allure.step("Arrange: create endpoint and SLA"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_sla(client, owner_headers, ep["id"])

    with allure.step("Act: GET /sla/{endpoint_id}/uptime"):
        response = await client.get(f"/api/v1/sla/{ep['id']}/uptime", headers=owner_headers)

    with allure.step("Assert: verify uptime data"):
        assert response.status_code == 200
        data = response.json()
        assert "uptime_percent" in data
        assert "total_runs" in data
        assert "is_breached" in data
