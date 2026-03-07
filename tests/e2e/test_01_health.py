"""Health check — verifies the API is running and database is connected."""

import pytest
from playwright.sync_api import APIRequestContext


class TestHealthCheck:
    @pytest.mark.smoke
    def test_health_endpoint_returns_ok(self, api: APIRequestContext):
        resp = api.get("/api/v1/health")
        assert resp.ok
        data = resp.json()
        assert data["status"] == "ok"
        assert data["app"] == "SentinelAI"
        assert data["database"] == "connected"
        assert "version" in data

    @pytest.mark.smoke
    def test_health_returns_correct_content_type(self, api: APIRequestContext):
        resp = api.get("/api/v1/health")
        assert "application/json" in resp.headers.get("content-type", "")

    def test_nonexistent_route_returns_404(self, api: APIRequestContext):
        resp = api.get("/api/v1/nonexistent")
        assert resp.status == 404
