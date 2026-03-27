"""Invite management tests -- create, list, revoke, validate."""
import pytest

from .factories import invite_payload

pytestmark = [pytest.mark.regression]


# ── Create ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_invite(client, owner_headers):
    """POST /api/v1/invites/ creates a new invite (OWNER can invite)."""
    payload = invite_payload()
    response = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "MEMBER"
    assert "token" in data
    assert "invite_url" in data


@pytest.mark.asyncio
async def test_admin_can_create_invite(client, admin_headers):
    """ADMIN role can also create invites."""
    payload = invite_payload()
    response = await client.post("/api/v1/invites/", json=payload, headers=admin_headers)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_member_cannot_create_invite(client, member_headers):
    """MEMBER role cannot create invites (403)."""
    payload = invite_payload()
    response = await client.post("/api/v1/invites/", json=payload, headers=member_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_invite_owner_role_rejected(client, owner_headers):
    """Cannot invite with OWNER role."""
    payload = invite_payload(role="OWNER")
    response = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
    assert response.status_code == 400


# ── List ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_invites(client, owner_headers):
    """GET /api/v1/invites/ lists pending invites."""
    # Create one first
    payload = invite_payload()
    await client.post("/api/v1/invites/", json=payload, headers=owner_headers)

    response = await client.get("/api/v1/invites/", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ── Revoke ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_revoke_invite(client, owner_headers):
    """DELETE /api/v1/invites/{id} revokes a pending invite."""
    # Create
    payload = invite_payload()
    create_r = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
    invite_id = create_r.json()["id"]

    # Revoke
    response = await client.delete(f"/api/v1/invites/{invite_id}", headers=owner_headers)
    assert response.status_code == 204


# ── Validate Token ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_validate_invite_token(client, owner_headers):
    """GET /api/v1/auth/invites/{token}/validate returns invite details."""
    payload = invite_payload()
    create_r = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
    token = create_r.json()["token"]

    response = await client.get(f"/api/v1/auth/invites/{token}/validate")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["email"] == payload["email"]


@pytest.mark.asyncio
async def test_validate_invalid_token(client):
    """Validating a nonexistent token returns valid=false."""
    response = await client.get("/api/v1/auth/invites/nonexistent-token/validate")
    assert response.status_code == 200
    assert response.json()["valid"] is False
