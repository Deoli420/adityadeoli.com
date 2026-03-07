"""SLA Management — create SLA config, track uptime, detect breaches."""

import pytest
from playwright.sync_api import APIRequestContext


class TestSLACrud:
    @pytest.mark.crud
    def test_create_sla_config(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/sla", data={
            "endpoint_id": test_endpoint["id"],
            "sla_target_percent": 99.9,
            "uptime_window": "24h",
        })
        # 201 or 200 (if already exists from another test run)
        assert resp.status in (200, 201)
        data = resp.json()
        assert data["sla_target_percent"] == 99.9
        assert data["uptime_window"] == "24h"
        assert data["is_active"] is True

    @pytest.mark.crud
    def test_get_sla_config(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/sla/{test_endpoint['id']}")
        assert resp.ok
        data = resp.json()
        assert data["endpoint_id"] == test_endpoint["id"]

    @pytest.mark.crud
    def test_update_sla_target(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.patch(f"/api/v1/sla/{test_endpoint['id']}", data={
            "sla_target_percent": 99.5,
            "uptime_window": "7d",
        })
        assert resp.ok
        data = resp.json()
        assert data["sla_target_percent"] == 99.5
        assert data["uptime_window"] == "7d"


class TestUptimeTracking:
    @pytest.mark.pipeline
    def test_get_uptime_stats(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/sla/{test_endpoint['id']}/uptime")
        assert resp.ok
        data = resp.json()
        assert "uptime_percent" in data
        assert "total_runs" in data
        assert "successful_runs" in data
        assert "is_breached" in data
        assert 0 <= data["uptime_percent"] <= 100

    @pytest.mark.pipeline
    def test_uptime_reflects_run_results(self, admin_api: APIRequestContext, test_endpoint: dict):
        """After running a healthy endpoint, uptime should be high."""
        # Trigger a run
        admin_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")
        resp = admin_api.get(f"/api/v1/sla/{test_endpoint['id']}/uptime")
        assert resp.ok
        data = resp.json()
        assert data["successful_runs"] >= 1
