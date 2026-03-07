"""Proxy — server-side HTTP requests, SSRF protection."""

import json
import pytest
from playwright.sync_api import APIRequestContext


class TestProxy:
    def test_proxy_get_request(self, admin_api: APIRequestContext, mock_url: str):
        """Proxy routes through the API container, so use Docker-internal mock_url."""
        resp = admin_api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "GET",
            "url": f"{mock_url}/api/healthy",
        }), headers={"Content-Type": "application/json"})
        assert resp.ok, f"Proxy GET failed: {resp.status} — {resp.text()}"
        data = resp.json()
        assert data["status"] == 200
        assert "timing" in data
        assert data["timing"]["duration"] >= 0

    def test_proxy_post_with_body(self, admin_api: APIRequestContext, mock_url: str):
        resp = admin_api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "POST",
            "url": f"{mock_url}/api/echo",
            "body": {"type": "json", "raw": '{"test": true}'},
        }), headers={"Content-Type": "application/json"})
        assert resp.ok, f"Proxy POST failed: {resp.status} — {resp.text()}"

    @pytest.mark.security
    def test_proxy_blocks_ssrf_localhost(self, admin_api: APIRequestContext):
        """SSRF protection should block requests to localhost."""
        resp = admin_api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "GET",
            "url": "http://127.0.0.1:8000/api/v1/health",
        }), headers={"Content-Type": "application/json"})
        assert resp.status == 400

    @pytest.mark.security
    def test_proxy_blocks_ssrf_private_ip(self, admin_api: APIRequestContext):
        """SSRF protection should block requests to private IP ranges."""
        resp = admin_api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "GET",
            "url": "http://192.168.1.1/admin",
        }), headers={"Content-Type": "application/json"})
        assert resp.status == 400

    @pytest.mark.security
    def test_proxy_blocks_metadata_endpoint(self, admin_api: APIRequestContext):
        """SSRF protection should block cloud metadata endpoints."""
        resp = admin_api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "GET",
            "url": "http://169.254.169.254/latest/meta-data/",
        }), headers={"Content-Type": "application/json"})
        assert resp.status == 400

    def test_proxy_requires_auth(self, api: APIRequestContext):
        resp = api.post("/api/v1/proxy/test-request", data=json.dumps({
            "method": "GET",
            "url": "http://example.com",
        }), headers={"Content-Type": "application/json"})
        assert resp.status == 401
