"""Export — CSV exports for runs, incidents, risk scores, SLA."""

import pytest
from playwright.sync_api import APIRequestContext


class TestExport:
    @pytest.mark.export
    def test_export_runs_csv(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/export/runs")
        assert resp.ok
        content_type = resp.headers.get("content-type", "")
        body = resp.text()
        # Should be CSV or streaming response
        assert "csv" in content_type or "text" in content_type or "octet" in content_type or len(body) > 0

    @pytest.mark.export
    def test_export_incidents_csv(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/export/incidents")
        assert resp.ok

    @pytest.mark.export
    def test_export_risks_csv(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/export/risk-scores")
        assert resp.ok

    @pytest.mark.export
    def test_export_sla_csv(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/export/sla")
        assert resp.ok

    @pytest.mark.export
    def test_export_runs_with_date_filter(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/export/runs?date_from=2024-01-01&date_to=2030-12-31")
        assert resp.ok

    @pytest.mark.export
    def test_export_requires_auth(self, api: APIRequestContext):
        resp = api.get("/api/v1/export/runs")
        assert resp.status == 401
