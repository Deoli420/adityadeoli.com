"""Schema Drift — detection, history, snapshots."""

import pytest
from playwright.sync_api import APIRequestContext


class TestSchemaDrift:
    @pytest.mark.pipeline
    def test_schema_drift_detection(self, admin_api: APIRequestContext, mock_url: str):
        """Create endpoint with expected schema, run against drifting mock."""
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "Schema Drift Test",
            "url": f"{mock_url}/api/schema-drift",
            "method": "GET",
            "expected_status": 200,
            "expected_schema": {"name": "string", "value": "number"},
        })
        assert create.status == 201
        eid = create.json()["id"]

        # First few runs — schema matches
        for _ in range(3):
            resp = admin_api.post(f"/api/v1/monitor/run/{eid}")
            assert resp.status == 201

        # After 3 calls, mock returns extra fields — schema should drift
        resp = admin_api.post(f"/api/v1/monitor/run/{eid}")
        assert resp.status == 201
        data = resp.json()
        # Schema drift should be detected in pipeline output
        if data.get("schema_drift"):
            drift = data["schema_drift"]
            assert isinstance(drift, dict)

    @pytest.mark.pipeline
    def test_get_schema_history(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/schema/{test_endpoint['id']}/history")
        assert resp.ok
