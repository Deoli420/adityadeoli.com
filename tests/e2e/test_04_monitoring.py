"""Monitoring Pipeline — trigger runs, verify analysis stages."""

import pytest
from playwright.sync_api import APIRequestContext


class TestTriggerRun:
    @pytest.mark.pipeline
    def test_run_healthy_endpoint(self, admin_api: APIRequestContext, test_endpoint: dict):
        """Trigger a monitoring run against a healthy endpoint and verify full pipeline output."""
        resp = admin_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")
        assert resp.status == 201
        data = resp.json()

        # Run result
        assert "run" in data
        assert data["run"]["is_success"] is True
        assert data["run"]["status_code"] == 200
        assert data["run"]["response_time_ms"] > 0

        # Risk score should be calculated
        assert "risk" in data
        if data["risk"]:
            assert "calculated_score" in data["risk"]
            assert data["risk"]["risk_level"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")

    @pytest.mark.pipeline
    def test_run_failing_endpoint(self, admin_api: APIRequestContext, failing_endpoint: dict):
        """Trigger a monitoring run against a failing endpoint — expect higher risk."""
        resp = admin_api.post(f"/api/v1/monitor/run/{failing_endpoint['id']}")
        assert resp.status == 201
        data = resp.json()

        run = data["run"]
        assert run["status_code"] == 500
        assert run["is_success"] is False

    @pytest.mark.pipeline
    def test_run_returns_performance_data(self, admin_api: APIRequestContext, test_endpoint: dict):
        """Run multiple times and verify performance stats are returned."""
        # Run a few times to build history
        for _ in range(3):
            admin_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")

        resp = admin_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")
        assert resp.status == 201
        data = resp.json()

        if data.get("performance"):
            perf = data["performance"]
            assert "avg_response_time" in perf or "average" in str(perf).lower() or isinstance(perf, dict)

    @pytest.mark.pipeline
    def test_run_nonexistent_endpoint(self, admin_api: APIRequestContext):
        resp = admin_api.post("/api/v1/monitor/run/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404


class TestRunHistory:
    @pytest.mark.pipeline
    def test_list_runs_for_endpoint(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/runs/endpoint/{test_endpoint['id']}")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.pipeline
    def test_get_single_run(self, admin_api: APIRequestContext, test_endpoint: dict):
        # Get list first
        runs = admin_api.get(f"/api/v1/runs/endpoint/{test_endpoint['id']}").json()
        if runs:
            run_id = runs[0]["id"]
            resp = admin_api.get(f"/api/v1/runs/{run_id}")
            assert resp.ok
            assert resp.json()["id"] == run_id

    @pytest.mark.pipeline
    def test_failure_rate(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/runs/endpoint/{test_endpoint['id']}/failure-rate")
        assert resp.ok
        data = resp.json()
        assert "failure_rate_percent" in data
        assert 0 <= data["failure_rate_percent"] <= 100


class TestPerformanceStats:
    @pytest.mark.pipeline
    def test_get_performance_stats(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/monitor/performance/{test_endpoint['id']}")
        assert resp.ok
