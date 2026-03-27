"""Invite management tests -- create, list, revoke, validate."""
import allure
import pytest

from .factories import invite_payload

pytestmark = [pytest.mark.regression]


# ── Create ────────────────────────────────────────────────────────────────


@allure.feature("Team Invites")
@allure.story("Owner can create invite")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /invites/ creates a new invite (OWNER can invite)")
@pytest.mark.asyncio
async def test_create_invite(client, owner_headers):
    """POST /api/v1/invites/ creates a new invite (OWNER can invite)."""
    with allure.step("Arrange: prepare invite payload"):
        payload = invite_payload()

    with allure.step("Act: POST /invites/"):
        response = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)

    with allure.step("Assert: verify 201 and invite data"):
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == payload["email"]
        assert data["role"] == "MEMBER"
        assert "token" in data
        assert "invite_url" in data


@allure.feature("Team Invites")
@allure.story("Admin can create invite")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("ADMIN role can also create invites")
@pytest.mark.asyncio
async def test_admin_can_create_invite(client, admin_headers):
    """ADMIN role can also create invites."""
    payload = invite_payload()
    response = await client.post("/api/v1/invites/", json=payload, headers=admin_headers)
    assert response.status_code == 201


@allure.feature("Team Invites")
@allure.story("Member cannot create invite")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("MEMBER role cannot create invites (403)")
@pytest.mark.asyncio
async def test_member_cannot_create_invite(client, member_headers):
    """MEMBER role cannot create invites (403)."""
    payload = invite_payload()
    response = await client.post("/api/v1/invites/", json=payload, headers=member_headers)
    assert response.status_code == 403


@allure.feature("Team Invites")
@allure.story("Cannot invite with OWNER role")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Cannot invite with OWNER role (400)")
@pytest.mark.asyncio
async def test_create_invite_owner_role_rejected(client, owner_headers):
    """Cannot invite with OWNER role."""
    payload = invite_payload(role="OWNER")
    response = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
    assert response.status_code == 400


# ── List ──────────────────────────────────────────────────────────────────


@allure.feature("Team Invites")
@allure.story("List pending invites")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /invites/ lists pending invites")
@pytest.mark.asyncio
async def test_list_invites(client, owner_headers):
    """GET /api/v1/invites/ lists pending invites."""
    with allure.step("Arrange: create an invite"):
        payload = invite_payload()
        await client.post("/api/v1/invites/", json=payload, headers=owner_headers)

    with allure.step("Act: GET /invites/"):
        response = await client.get("/api/v1/invites/", headers=owner_headers)

    with allure.step("Assert: verify list response"):
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


# ── Revoke ────────────────────────────────────────────────────────────────


@allure.feature("Team Invites")
@allure.story("Revoke a pending invite")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("DELETE /invites/{id} revokes a pending invite")
@pytest.mark.asyncio
async def test_revoke_invite(client, owner_headers):
    """DELETE /api/v1/invites/{id} revokes a pending invite."""
    with allure.step("Arrange: create an invite"):
        payload = invite_payload()
        create_r = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
        invite_id = create_r.json()["id"]

    with allure.step("Act: DELETE /invites/{id}"):
        response = await client.delete(f"/api/v1/invites/{invite_id}", headers=owner_headers)

    with allure.step("Assert: verify 204"):
        assert response.status_code == 204


# ── Validate Token ────────────────────────────────────────────────────────


@allure.feature("Team Invites")
@allure.story("Validate invite token")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("GET /auth/invites/{token}/validate returns invite details")
@pytest.mark.asyncio
async def test_validate_invite_token(client, owner_headers):
    """GET /api/v1/auth/invites/{token}/validate returns invite details."""
    with allure.step("Arrange: create an invite"):
        payload = invite_payload()
        create_r = await client.post("/api/v1/invites/", json=payload, headers=owner_headers)
        token = create_r.json()["token"]

    with allure.step("Act: GET /auth/invites/{token}/validate"):
        response = await client.get(f"/api/v1/auth/invites/{token}/validate")

    with allure.step("Assert: verify valid=True and email"):
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["email"] == payload["email"]


@allure.feature("Team Invites")
@allure.story("Validate invalid invite token")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Validating a nonexistent token returns valid=false")
@pytest.mark.asyncio
async def test_validate_invalid_token(client):
    """Validating a nonexistent token returns valid=false."""
    response = await client.get("/api/v1/auth/invites/nonexistent-token/validate")
    assert response.status_code == 200
    assert response.json()["valid"] is False
