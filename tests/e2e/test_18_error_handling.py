"""Error Handling — validation errors, not found, bad requests."""

import pytest
from playwright.sync_api import APIRequestContext


class TestValidationErrors:
    def test_invalid_uuid_format(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/endpoints/not-a-uuid")
        assert resp.status == 422

    def test_create_endpoint_missing_required_fields(self, admin_api: APIRequestContext):
        resp = admin_api.post("/api/v1/endpoints", data={})
        assert resp.status == 422

    def test_create_endpoint_invalid_method(self, admin_api: APIRequestContext, mock_url: str):
        resp = admin_api.post("/api/v1/endpoints", data={
            "name": "Bad Method",
            "url": f"{mock_url}/api/healthy",
            "method": "INVALID",
        })
        assert resp.status == 422

    def test_create_endpoint_invalid_status_code(self, admin_api: APIRequestContext, mock_url: str):
        resp = admin_api.post("/api/v1/endpoints", data={
            "name": "Bad Status",
            "url": f"{mock_url}/api/healthy",
            "expected_status": 999,
        })
        assert resp.status == 422

    def test_create_sla_invalid_window(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/sla", data={
            "endpoint_id": test_endpoint["id"],
            "uptime_window": "invalid",
        })
        assert resp.status == 422

    def test_create_alert_rule_invalid_condition(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/alert-rules", data={
            "endpoint_id": test_endpoint["id"],
            "name": "Bad Condition",
            "condition_type": "INVALID_TYPE",
            "threshold": 100,
        })
        assert resp.status == 422

    def test_create_incident_invalid_severity(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Bad Severity",
            "severity": "INVALID",
        })
        assert resp.status == 422


class TestNotFound:
    def test_get_nonexistent_endpoint(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/endpoints/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404

    def test_get_nonexistent_run(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/runs/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404

    def test_get_nonexistent_incident(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/incidents/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404

    def test_monitor_nonexistent_endpoint(self, admin_api: APIRequestContext):
        resp = admin_api.post("/api/v1/monitor/run/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404


class TestContentType:
    def test_api_returns_json(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/endpoints")
        assert "application/json" in resp.headers.get("content-type", "")
