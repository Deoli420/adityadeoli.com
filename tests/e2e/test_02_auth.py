"""Authentication — login, refresh, logout, token validation, lockout."""

import pytest
from playwright.sync_api import APIRequestContext


class TestLogin:
    @pytest.mark.auth
    def test_login_valid_credentials(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={
            "email": "admin@test.com",
            "password": "testpassword123",
            "organization_slug": "test-org",
        })
        assert resp.ok
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@test.com"
        assert data["user"]["role"] == "ADMIN"
        assert data["user"]["organization"]["slug"] == "test-org"

    @pytest.mark.auth
    def test_login_wrong_password(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={
            "email": "admin@test.com",
            "password": "wrongpassword",
            "organization_slug": "test-org",
        })
        assert resp.status == 401
        assert "Invalid credentials" in resp.json().get("detail", "")

    @pytest.mark.auth
    def test_login_nonexistent_user(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={
            "email": "nobody@test.com",
            "password": "testpassword123",
            "organization_slug": "test-org",
        })
        assert resp.status == 401

    @pytest.mark.auth
    def test_login_wrong_org(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={
            "email": "admin@test.com",
            "password": "testpassword123",
            "organization_slug": "nonexistent-org",
        })
        assert resp.status == 401

    @pytest.mark.auth
    def test_login_missing_fields(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={"email": "admin@test.com"})
        assert resp.status == 422  # Validation error

    @pytest.mark.auth
    def test_login_member_user(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/login", data={
            "email": "member@test.com",
            "password": "testpassword123",
            "organization_slug": "test-org",
        })
        assert resp.ok
        assert resp.json()["user"]["role"] == "MEMBER"


class TestTokenValidation:
    @pytest.mark.auth
    def test_protected_endpoint_without_token(self, api: APIRequestContext):
        resp = api.get("/api/v1/auth/me")
        assert resp.status == 401

    @pytest.mark.auth
    def test_protected_endpoint_with_invalid_token(self, api: APIRequestContext):
        from playwright.sync_api import Playwright
        # Use raw request with bad token
        resp = api.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status == 401

    @pytest.mark.auth
    def test_get_current_user(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/auth/me")
        assert resp.ok
        data = resp.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "ADMIN"
        assert data["organization"]["slug"] == "test-org"

    @pytest.mark.auth
    def test_member_can_access_protected_endpoints(self, member_api: APIRequestContext):
        resp = member_api.get("/api/v1/auth/me")
        assert resp.ok
        assert resp.json()["role"] == "MEMBER"


class TestLogout:
    @pytest.mark.auth
    def test_logout_requires_auth(self, api: APIRequestContext):
        resp = api.post("/api/v1/auth/logout")
        assert resp.status == 401

    @pytest.mark.auth
    def test_logout_succeeds(self, api: APIRequestContext, playwright):
        """Login with a fresh token, then logout. Don't use session-scoped admin_api to avoid invalidating it."""
        # Get a fresh token
        login_resp = api.post("/api/v1/auth/login", data={
            "email": "admin@test.com",
            "password": "testpassword123",
            "organization_slug": "test-org",
        })
        assert login_resp.ok
        token = login_resp.json()["access_token"]

        # Create a temporary API context with this fresh token
        temp_ctx = playwright.request.new_context(
            base_url="http://localhost:8000",
            extra_http_headers={"Authorization": f"Bearer {token}"},
        )
        resp = temp_ctx.post("/api/v1/auth/logout")
        assert resp.status == 204
        temp_ctx.dispose()
