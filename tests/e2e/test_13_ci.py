"""CI Integration — synchronous endpoint runs for CI/CD pipelines."""

import pytest
from playwright.sync_api import APIRequestContext


class TestCIIntegration:
    def test_ci_run_by_endpoint_id(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post(f"/api/v1/ci/run?endpoint_id={test_endpoint['id']}")
        assert resp.ok
        data = resp.json()
        assert "is_success" in data
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["endpoint_name"] == test_endpoint["name"]

    def test_ci_run_by_name(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post(f"/api/v1/ci/run?name={test_endpoint['name']}")
        assert resp.ok
        data = resp.json()
        assert data["is_success"] is True

    def test_ci_run_nonexistent(self, admin_api: APIRequestContext):
        resp = admin_api.post("/api/v1/ci/run?name=nonexistent-endpoint-xyz")
        assert resp.status == 404

    def test_ci_run_requires_auth(self, api: APIRequestContext):
        resp = api.post("/api/v1/ci/run?name=test")
        assert resp.status == 401
