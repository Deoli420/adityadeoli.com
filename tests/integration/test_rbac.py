"""
Role-Based Access Control tests.

Verifies that role restrictions are enforced consistently across all
write-protected endpoints.

Role hierarchy:  OWNER > ADMIN > MEMBER > VIEWER
RequireWrite = OWNER | ADMIN | MEMBER  (VIEWER excluded)
RequireAdmin = OWNER | ADMIN
"""
import pytest

from .factories import (
    alert_rule_payload,
    endpoint_payload,
    incident_payload,
    invite_payload,
    sla_payload,
)

pytestmark = [pytest.mark.integration]


# ── Helpers ───────────────────────────────────────────────────────────────


async def _create_endpoint(client, headers) -> dict:
    r = await client.post("/api/v1/endpoints/", json=endpoint_payload(), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


# ── VIEWER cannot write ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_viewer_cannot_create_endpoint(client, viewer_headers):
    """VIEWER cannot POST /api/v1/endpoints/ (403)."""
    r = await client.post(
        "/api/v1/endpoints/", json=endpoint_payload(), headers=viewer_headers
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_create_incident(client, viewer_headers, owner_headers):
    """VIEWER cannot POST /api/v1/incidents/ (403)."""
    ep = await _create_endpoint(client, owner_headers)
    r = await client.post(
        "/api/v1/incidents/",
        json=incident_payload(ep["id"]),
        headers=viewer_headers,
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_create_alert_rule(client, viewer_headers, owner_headers):
    """VIEWER cannot POST /api/v1/alert-rules/ (403)."""
    ep = await _create_endpoint(client, owner_headers)
    r = await client.post(
        "/api/v1/alert-rules/",
        json=alert_rule_payload(ep["id"]),
        headers=viewer_headers,
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_create_sla(client, viewer_headers, owner_headers):
    """VIEWER cannot POST /api/v1/sla/ (403)."""
    ep = await _create_endpoint(client, owner_headers)
    r = await client.post(
        "/api/v1/sla/",
        json=sla_payload(ep["id"]),
        headers=viewer_headers,
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_delete_endpoint(client, viewer_headers, owner_headers):
    """VIEWER cannot DELETE /api/v1/endpoints/{id} (403)."""
    ep = await _create_endpoint(client, owner_headers)
    r = await client.delete(
        f"/api/v1/endpoints/{ep['id']}", headers=viewer_headers
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_viewer_cannot_update_endpoint(client, viewer_headers, owner_headers):
    """VIEWER cannot PATCH /api/v1/endpoints/{id} (403)."""
    ep = await _create_endpoint(client, owner_headers)
    r = await client.patch(
        f"/api/v1/endpoints/{ep['id']}",
        json={"name": "Hacked"},
        headers=viewer_headers,
    )
    assert r.status_code == 403


# ── VIEWER can read ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_viewer_can_list_endpoints(client, viewer_headers, owner_headers):
    """VIEWER can GET /api/v1/endpoints/ (200)."""
    await _create_endpoint(client, owner_headers)
    r = await client.get("/api/v1/endpoints/", headers=viewer_headers)
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_viewer_can_list_incidents(client, viewer_headers):
    """VIEWER can GET /api/v1/incidents/ (200)."""
    r = await client.get("/api/v1/incidents/", headers=viewer_headers)
    assert r.status_code == 200


# ── MEMBER can create but cannot invite ───────────────────────────────────


@pytest.mark.asyncio
async def test_member_can_create_endpoint(client, member_headers):
    """MEMBER CAN create endpoints."""
    r = await client.post(
        "/api/v1/endpoints/", json=endpoint_payload(), headers=member_headers
    )
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_member_cannot_invite(client, member_headers):
    """MEMBER cannot POST /api/v1/invites/ (403)."""
    r = await client.post(
        "/api/v1/invites/", json=invite_payload(), headers=member_headers
    )
    assert r.status_code == 403


# ── ADMIN can invite but cannot transfer ownership ────────────────────────


@pytest.mark.asyncio
async def test_admin_can_invite(client, admin_headers):
    """ADMIN CAN create invites."""
    r = await client.post(
        "/api/v1/invites/", json=invite_payload(), headers=admin_headers
    )
    assert r.status_code == 201


@pytest.mark.asyncio
async def test_admin_cannot_set_owner_role(client, admin_headers, test_member):
    """ADMIN cannot set a user's role to OWNER."""
    r = await client.patch(
        f"/api/v1/users/{test_member.id}/role",
        json={"role": "OWNER"},
        headers=admin_headers,
    )
    assert r.status_code == 400
