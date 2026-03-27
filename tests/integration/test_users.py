"""User management tests -- profile, list, password change."""
import pytest

pytestmark = [pytest.mark.regression]


# ── Get Current User ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_my_profile(client, owner_headers):
    """GET /api/v1/users/me returns the current user profile."""
    response = await client.get("/api/v1/users/me", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "owner@test.com"
    assert data["role"] == "OWNER"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_get_profile_unauthenticated(client):
    """GET /api/v1/users/me without auth returns 401."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code in (401, 403)


# ── List Users ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_users(client, owner_headers, test_admin, test_member):
    """GET /api/v1/users/ returns all org members."""
    response = await client.get("/api/v1/users/", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # At least the owner, admin, and member
    assert len(data) >= 3
    emails = [u["email"] for u in data]
    assert "owner@test.com" in emails
    assert "admin@test.com" in emails


# ── Update Profile ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_display_name(client, owner_headers):
    """PATCH /api/v1/users/me updates display name."""
    response = await client.patch(
        "/api/v1/users/me",
        json={"display_name": "Updated Owner"},
        headers=owner_headers,
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Updated Owner"


@pytest.mark.asyncio
async def test_update_profile_no_fields(client, owner_headers):
    """PATCH /api/v1/users/me with empty body returns 400."""
    response = await client.patch(
        "/api/v1/users/me", json={}, headers=owner_headers
    )
    assert response.status_code == 400


# ── Change Password ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_change_password(client, owner_headers):
    """PATCH /api/v1/users/me/password changes the password."""
    response = await client.patch(
        "/api/v1/users/me/password",
        json={
            "current_password": "TestPass123!",
            "new_password": "NewSecure456!",
        },
        headers=owner_headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_change_password_wrong_current(client, owner_headers):
    """PATCH /api/v1/users/me/password with wrong current password returns 400."""
    response = await client.patch(
        "/api/v1/users/me/password",
        json={
            "current_password": "WrongPassword!",
            "new_password": "NewSecure456!",
        },
        headers=owner_headers,
    )
    assert response.status_code == 400
