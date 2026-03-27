"""Alert rule CRUD + toggle tests."""
import allure
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


@allure.feature("Alert Rules")
@allure.story("Create a new alert rule")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /alert-rules/ creates a new alert rule")
@pytest.mark.asyncio
async def test_create_alert_rule(client, owner_headers):
    """POST /api/v1/alert-rules/ creates a new alert rule."""
    with allure.step("Arrange: create endpoint"):
        ep = await _create_endpoint(client, owner_headers)

    with allure.step("Act: POST /alert-rules/"):
        rule = await _create_rule(client, owner_headers, ep["id"])

    with allure.step("Assert: verify alert rule data"):
        assert rule["endpoint_id"] == ep["id"]
        assert rule["condition_type"] == "LATENCY_ABOVE"
        assert rule["threshold"] == 1000.0
        assert rule["is_active"] is True


# ── List ──────────────────────────────────────────────────────────────────


@allure.feature("Alert Rules")
@allure.story("List alert rules for endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /alert-rules/endpoint/{id} returns rules for an endpoint")
@pytest.mark.asyncio
async def test_list_alert_rules(client, owner_headers):
    """GET /api/v1/alert-rules/endpoint/{id} returns rules for an endpoint."""
    with allure.step("Arrange: create endpoint and alert rule"):
        ep = await _create_endpoint(client, owner_headers)
        await _create_rule(client, owner_headers, ep["id"])

    with allure.step("Act: GET /alert-rules/endpoint/{id}"):
        response = await client.get(
            f"/api/v1/alert-rules/endpoint/{ep['id']}", headers=owner_headers
        )

    with allure.step("Assert: verify rules list"):
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ── Update ────────────────────────────────────────────────────────────────


@allure.feature("Alert Rules")
@allure.story("Update alert rule fields")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("PATCH /alert-rules/{id} updates rule fields")
@pytest.mark.asyncio
async def test_update_alert_rule(client, owner_headers):
    """PATCH /api/v1/alert-rules/{id} updates rule fields."""
    with allure.step("Arrange: create endpoint and alert rule"):
        ep = await _create_endpoint(client, owner_headers)
        rule = await _create_rule(client, owner_headers, ep["id"])

    with allure.step("Act: PATCH /alert-rules/{id}"):
        response = await client.patch(
            f"/api/v1/alert-rules/{rule['id']}",
            json={"name": "Updated Rule", "threshold": 2000.0},
            headers=owner_headers,
        )

    with allure.step("Assert: verify updated fields"):
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Rule"
        assert data["threshold"] == 2000.0


# ── Delete ────────────────────────────────────────────────────────────────


@allure.feature("Alert Rules")
@allure.story("Delete alert rule")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("DELETE /alert-rules/{id} returns 204")
@pytest.mark.asyncio
async def test_delete_alert_rule(client, owner_headers):
    """DELETE /api/v1/alert-rules/{id} returns 204."""
    with allure.step("Arrange: create endpoint and alert rule"):
        ep = await _create_endpoint(client, owner_headers)
        rule = await _create_rule(client, owner_headers, ep["id"])

    with allure.step("Act: DELETE /alert-rules/{id}"):
        response = await client.delete(
            f"/api/v1/alert-rules/{rule['id']}", headers=owner_headers
        )

    with allure.step("Assert: verify 204"):
        assert response.status_code == 204


# ── Toggle ────────────────────────────────────────────────────────────────


@allure.feature("Alert Rules")
@allure.story("Toggle alert rule active state")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /alert-rules/{id}/toggle flips is_active on and off")
@pytest.mark.asyncio
async def test_toggle_alert_rule(client, owner_headers):
    """POST /api/v1/alert-rules/{id}/toggle flips is_active."""
    with allure.step("Arrange: create endpoint and alert rule"):
        ep = await _create_endpoint(client, owner_headers)
        rule = await _create_rule(client, owner_headers, ep["id"])
        assert rule["is_active"] is True

    with allure.step("Act: toggle off"):
        response = await client.post(
            f"/api/v1/alert-rules/{rule['id']}/toggle", headers=owner_headers
        )

    with allure.step("Assert: verify is_active is False"):
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    with allure.step("Act: toggle back on"):
        response2 = await client.post(
            f"/api/v1/alert-rules/{rule['id']}/toggle", headers=owner_headers
        )

    with allure.step("Assert: verify is_active is True"):
        assert response2.status_code == 200
        assert response2.json()["is_active"] is True
