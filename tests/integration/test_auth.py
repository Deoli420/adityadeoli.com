"""Authentication tests -- login, signup, token management."""
import pytest

pytestmark = [pytest.mark.smoke, pytest.mark.regression]


# ── Login ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_valid_credentials(client, test_owner, test_org):
    """POST /api/v1/auth/login with valid credentials returns access_token."""
    # Arrange
    payload = {
        "email": "owner@test.com",
        "password": "TestPass123!",
        "organization_slug": test_org.slug,
    }

    # Act
    response = await client.post("/api/v1/auth/login", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "owner@test.com"
    assert data["user"]["organization"]["slug"] == test_org.slug


@pytest.mark.asyncio
async def test_login_wrong_password(client, test_owner, test_org):
    """Login with incorrect password returns 401."""
    payload = {
        "email": "owner@test.com",
        "password": "WrongPassword!",
        "organization_slug": test_org.slug,
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_wrong_org_slug(client, test_owner, test_org):
    """Login with nonexistent org slug returns 401."""
    payload = {
        "email": "owner@test.com",
        "password": "TestPass123!",
        "organization_slug": "nonexistent-org",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields(client):
    """Login with missing required fields returns 422."""
    response = await client.post("/api/v1/auth/login", json={"email": "x@x.com"})
    assert response.status_code == 422


# ── Signup ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_signup_creates_org_and_user(client):
    """POST /api/v1/auth/signup creates a new org and owner user."""
    payload = {
        "display_name": "New User",
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "org_name": "New Org",
    }
    response = await client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "OWNER"
    assert data["user"]["organization"]["name"] == "New Org"


@pytest.mark.asyncio
async def test_signup_duplicate_email_same_org(client):
    """Signing up twice with same org name still succeeds (slug dedup)."""
    base = {
        "display_name": "User A",
        "email": "dup-a@example.com",
        "password": "SecurePass123!",
        "org_name": "Duplicate Org Test",
    }
    r1 = await client.post("/api/v1/auth/signup", json=base)
    assert r1.status_code == 200

    # Second signup with different email but same org name
    base["email"] = "dup-b@example.com"
    base["display_name"] = "User B"
    r2 = await client.post("/api/v1/auth/signup", json=base)
    assert r2.status_code == 200


# ── Token / Auth ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_access_without_token_returns_401(client):
    """Accessing a protected endpoint without a token returns 401."""
    response = await client.get("/api/v1/endpoints/")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_endpoint(client, owner_headers):
    """GET /api/v1/auth/me returns the current user."""
    response = await client.get("/api/v1/auth/me", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "owner@test.com"


@pytest.mark.asyncio
async def test_refresh_without_cookie_returns_401(client):
    """POST /api/v1/auth/refresh without cookie returns 401."""
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_returns_refresh_cookie(client, test_owner, test_org):
    """Successful login sets a refresh_token cookie."""
    payload = {
        "email": "owner@test.com",
        "password": "TestPass123!",
        "organization_slug": test_org.slug,
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    # httpx stores cookies automatically; check the response headers
    cookie_header = response.headers.get("set-cookie", "")
    assert "refresh_token" in cookie_header
