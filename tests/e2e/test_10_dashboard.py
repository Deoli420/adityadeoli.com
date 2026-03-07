"""Dashboard Analytics — stats, trends, risk distribution, uptime."""

import pytest
from playwright.sync_api import APIRequestContext


class TestDashboardStats:
    @pytest.mark.smoke
    def test_get_dashboard_stats(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/dashboard/stats")
        assert resp.ok
        data = resp.json()
        assert "total_endpoints" in data
        assert data["total_endpoints"] >= 1
        assert "anomalies_24h" in data
        assert "avg_risk_score" in data

    def test_response_trends(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/dashboard/response-trends?hours=24")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, (list, dict))

    def test_top_failures(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/dashboard/top-failures?limit=5")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, (list, dict))

    def test_risk_distribution(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/dashboard/risk-distribution")
        assert resp.ok

    def test_uptime_overview(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/dashboard/uptime-overview")
        assert resp.ok

    def test_dashboard_requires_auth(self, api: APIRequestContext):
        resp = api.get("/api/v1/dashboard/stats")
        assert resp.status == 401
