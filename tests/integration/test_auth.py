"""Authentication tests -- login, signup, token management."""
import allure
import pytest

pytestmark = [pytest.mark.smoke, pytest.mark.regression]


# ── Login ─────────────────────────────────────────────────────────────────


@allure.feature("Authentication")
@allure.story("Login with valid credentials")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("POST /auth/login with valid credentials returns access_token")
@pytest.mark.asyncio
async def test_login_valid_credentials(client, test_owner, test_org):
    """POST /api/v1/auth/login with valid credentials returns access_token."""
    with allure.step("Arrange: prepare login payload"):
        payload = {
            "email": "owner@test.com",
            "password": "TestPass123!",
            "organization_slug": test_org.slug,
        }

    with allure.step("Act: POST /auth/login"):
        response = await client.post("/api/v1/auth/login", json=payload)

    with allure.step("Assert: verify 200 and token data"):
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "owner@test.com"
        assert data["user"]["organization"]["slug"] == test_org.slug


@allure.feature("Authentication")
@allure.story("Login with wrong password")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /auth/login with incorrect password returns 401")
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


@allure.feature("Authentication")
@allure.story("Login with nonexistent org slug")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /auth/login with nonexistent org slug returns 401")
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


@allure.feature("Authentication")
@allure.story("Login with missing fields")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /auth/login with missing required fields returns 422")
@pytest.mark.asyncio
async def test_login_missing_fields(client):
    """Login with missing required fields returns 422."""
    response = await client.post("/api/v1/auth/login", json={"email": "x@x.com"})
    assert response.status_code == 422


# ── Signup ────────────────────────────────────────────────────────────────


@allure.feature("Authentication")
@allure.story("Signup creates org and owner user")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("POST /auth/signup creates a new org and owner user")
@pytest.mark.asyncio
async def test_signup_creates_org_and_user(client):
    """POST /api/v1/auth/signup creates a new org and owner user."""
    with allure.step("Arrange: prepare signup payload"):
        payload = {
            "display_name": "New User",
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "org_name": "New Org",
        }

    with allure.step("Act: POST /auth/signup"):
        response = await client.post("/api/v1/auth/signup", json=payload)

    with allure.step("Assert: verify 200 and user data"):
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["role"] == "OWNER"
        assert data["user"]["organization"]["name"] == "New Org"


@allure.feature("Authentication")
@allure.story("Signup with duplicate org name deduplicates slug")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Signup twice with same org name succeeds via slug dedup")
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


@allure.feature("Authentication")
@allure.story("Access without token is rejected")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Accessing protected endpoint without token returns 401")
@pytest.mark.asyncio
async def test_access_without_token_returns_401(client):
    """Accessing a protected endpoint without a token returns 401."""
    response = await client.get("/api/v1/endpoints/")
    assert response.status_code in (401, 403)


@allure.feature("Authentication")
@allure.story("GET /auth/me returns current user")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("GET /auth/me returns the current authenticated user")
@pytest.mark.asyncio
async def test_me_endpoint(client, owner_headers):
    """GET /api/v1/auth/me returns the current user."""
    response = await client.get("/api/v1/auth/me", headers=owner_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "owner@test.com"


@allure.feature("Authentication")
@allure.story("Refresh without cookie is rejected")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("POST /auth/refresh without cookie returns 401")
@pytest.mark.asyncio
async def test_refresh_without_cookie_returns_401(client):
    """POST /api/v1/auth/refresh without cookie returns 401."""
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


@allure.feature("Authentication")
@allure.story("Login sets refresh cookie")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Successful login sets a refresh_token cookie")
@pytest.mark.asyncio
async def test_login_returns_refresh_cookie(client, test_owner, test_org):
    """Successful login sets a refresh_token cookie."""
    with allure.step("Arrange: prepare login payload"):
        payload = {
            "email": "owner@test.com",
            "password": "TestPass123!",
            "organization_slug": test_org.slug,
        }

    with allure.step("Act: POST /auth/login"):
        response = await client.post("/api/v1/auth/login", json=payload)

    with allure.step("Assert: verify 200 and refresh_token cookie"):
        assert response.status_code == 200
        cookie_header = response.headers.get("set-cookie", "")
        assert "refresh_token" in cookie_header
