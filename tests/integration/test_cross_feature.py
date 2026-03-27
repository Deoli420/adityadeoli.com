"""
Cross-feature integration tests.

These tests exercise flows that span multiple API domains:
  endpoint -> incident -> status update -> timeline
  endpoint -> SLA -> uptime overview
"""
import allure
import pytest

from .factories import endpoint_payload, incident_payload, sla_payload

pytestmark = [pytest.mark.integration]


# ── Endpoint -> Incident -> Timeline flow ─────────────────────────────────


@allure.feature("Cross-Feature Integration")
@allure.story("Endpoint to incident to timeline lifecycle")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Full lifecycle: endpoint -> incident -> status transitions -> timeline")
@pytest.mark.asyncio
async def test_endpoint_incident_timeline_flow(client, owner_headers):
    """
    Full lifecycle:
      1. Create endpoint
      2. Create incident for it
      3. Update incident status OPEN -> INVESTIGATING -> RESOLVED
      4. Verify timeline events are recorded
    """
    with allure.step("Arrange: create endpoint"):
        ep_r = await client.post(
            "/api/v1/endpoints/", json=endpoint_payload(), headers=owner_headers
        )
        assert ep_r.status_code == 201
        ep = ep_r.json()

    with allure.step("Act: create incident"):
        inc_r = await client.post(
            "/api/v1/incidents/",
            json=incident_payload(ep["id"], severity="HIGH"),
            headers=owner_headers,
        )
        assert inc_r.status_code == 201
        inc = inc_r.json()
        assert inc["status"] == "OPEN"

    with allure.step("Act: transition OPEN -> INVESTIGATING"):
        inv_r = await client.patch(
            f"/api/v1/incidents/{inc['id']}/status",
            json={"status": "INVESTIGATING"},
            headers=owner_headers,
        )
        assert inv_r.status_code == 200
        assert inv_r.json()["status"] == "INVESTIGATING"
        assert inv_r.json()["acknowledged_at"] is not None

    with allure.step("Act: transition INVESTIGATING -> RESOLVED"):
        res_r = await client.patch(
            f"/api/v1/incidents/{inc['id']}/status",
            json={"status": "RESOLVED"},
            headers=owner_headers,
        )
        assert res_r.status_code == 200
        resolved = res_r.json()
        assert resolved["status"] == "RESOLVED"
        assert resolved["resolved_at"] is not None

    with allure.step("Assert: verify timeline events"):
        tl_r = await client.get(
            f"/api/v1/incidents/{inc['id']}/timeline", headers=owner_headers
        )
        assert tl_r.status_code == 200
        events = tl_r.json()
        assert isinstance(events, list)
        assert len(events) >= 2


# ── Endpoint -> SLA -> Uptime Overview flow ───────────────────────────────


@allure.feature("Cross-Feature Integration")
@allure.story("Endpoint to SLA to uptime overview lifecycle")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Full lifecycle: endpoint -> SLA config -> uptime overview includes endpoint")
@pytest.mark.asyncio
async def test_endpoint_sla_uptime_overview_flow(client, owner_headers):
    """
    Full lifecycle:
      1. Create endpoint
      2. Create SLA configuration for it
      3. Verify uptime overview includes the endpoint
    """
    with allure.step("Arrange: create endpoint"):
        ep_r = await client.post(
            "/api/v1/endpoints/", json=endpoint_payload(), headers=owner_headers
        )
        assert ep_r.status_code == 201
        ep = ep_r.json()

    with allure.step("Act: create SLA configuration"):
        sla_r = await client.post(
            "/api/v1/sla/",
            json=sla_payload(ep["id"], sla_target_percent=99.0),
            headers=owner_headers,
        )
        assert sla_r.status_code == 201

    with allure.step("Assert: uptime overview includes this endpoint"):
        overview_r = await client.get(
            "/api/v1/dashboard/uptime-overview", headers=owner_headers
        )
        assert overview_r.status_code == 200
        entries = overview_r.json()["entries"]
        ep_ids = [e["endpoint_id"] for e in entries]
        assert ep["id"] in ep_ids


# ── Endpoint -> Incident -> Notes flow ────────────────────────────────────


@allure.feature("Cross-Feature Integration")
@allure.story("Endpoint to incident to notes lifecycle")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Full lifecycle: endpoint -> incident -> add note -> verify persisted")
@pytest.mark.asyncio
async def test_incident_notes_flow(client, owner_headers):
    """
    1. Create endpoint + incident
    2. Add a note
    3. Verify notes are persisted on the incident
    """
    with allure.step("Arrange: create endpoint and incident"):
        ep_r = await client.post(
            "/api/v1/endpoints/", json=endpoint_payload(), headers=owner_headers
        )
        ep = ep_r.json()

        inc_r = await client.post(
            "/api/v1/incidents/",
            json=incident_payload(ep["id"]),
            headers=owner_headers,
        )
        inc = inc_r.json()

    with allure.step("Act: add note to incident"):
        note_r = await client.post(
            f"/api/v1/incidents/{inc['id']}/notes",
            json={"note": "Root cause identified: DNS timeout"},
            headers=owner_headers,
        )
        assert note_r.status_code == 200

    with allure.step("Assert: verify note is persisted via GET"):
        detail_r = await client.get(
            f"/api/v1/incidents/{inc['id']}", headers=owner_headers
        )
        assert detail_r.status_code == 200
        assert "DNS timeout" in (detail_r.json().get("notes") or "")


# ── Endpoint -> Alert Rule -> Toggle flow ─────────────────────────────────


@allure.feature("Cross-Feature Integration")
@allure.story("Endpoint to alert rule toggle lifecycle")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Full lifecycle: endpoint -> alert rule -> toggle -> delete -> verify empty")
@pytest.mark.asyncio
async def test_endpoint_alert_rule_toggle_flow(client, owner_headers):
    """
    1. Create endpoint
    2. Create alert rule
    3. Toggle it off and on
    4. Delete the alert rule
    5. Verify list is empty
    """
    from .factories import alert_rule_payload

    with allure.step("Arrange: create endpoint"):
        ep_r = await client.post(
            "/api/v1/endpoints/", json=endpoint_payload(), headers=owner_headers
        )
        ep = ep_r.json()

    with allure.step("Act: create alert rule"):
        rule_r = await client.post(
            "/api/v1/alert-rules/",
            json=alert_rule_payload(ep["id"]),
            headers=owner_headers,
        )
        assert rule_r.status_code == 201
        rule = rule_r.json()

    with allure.step("Act: toggle rule off"):
        toggle_r = await client.post(
            f"/api/v1/alert-rules/{rule['id']}/toggle", headers=owner_headers
        )
        assert toggle_r.json()["is_active"] is False

    with allure.step("Act: delete alert rule"):
        del_r = await client.delete(
            f"/api/v1/alert-rules/{rule['id']}", headers=owner_headers
        )
        assert del_r.status_code == 204

    with allure.step("Assert: verify list is now empty for this endpoint"):
        list_r = await client.get(
            f"/api/v1/alert-rules/endpoint/{ep['id']}", headers=owner_headers
        )
        assert list_r.status_code == 200
        assert len(list_r.json()) == 0
