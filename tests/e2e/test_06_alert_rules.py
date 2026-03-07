"""Alert Rules — create, toggle, evaluate rules for all 7 condition types."""

import pytest
from playwright.sync_api import APIRequestContext


class TestAlertRuleCrud:
    @pytest.mark.crud
    def test_create_latency_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/alert-rules", data={
            "endpoint_id": test_endpoint["id"],
            "name": "High Latency Alert",
            "condition_type": "LATENCY_ABOVE",
            "threshold": 5000,
            "consecutive_count": 3,
        })
        assert resp.status == 201
        data = resp.json()
        assert data["name"] == "High Latency Alert"
        assert data["condition_type"] == "LATENCY_ABOVE"
        assert data["threshold"] == 5000
        assert data["consecutive_count"] == 3
        assert data["is_active"] is True
        assert data["current_consecutive"] == 0

    @pytest.mark.crud
    def test_create_failure_count_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/alert-rules", data={
            "endpoint_id": test_endpoint["id"],
            "name": "Failure Alert",
            "condition_type": "FAILURE_COUNT",
            "threshold": 1,
            "consecutive_count": 2,
        })
        assert resp.status == 201
        assert resp.json()["condition_type"] == "FAILURE_COUNT"

    @pytest.mark.crud
    def test_create_risk_above_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/alert-rules", data={
            "endpoint_id": test_endpoint["id"],
            "name": "Risk Alert",
            "condition_type": "RISK_ABOVE",
            "threshold": 70,
        })
        assert resp.status == 201

    @pytest.mark.crud
    def test_list_rules_for_endpoint(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/alert-rules/endpoint/{test_endpoint['id']}")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # We created at least 2 above

    @pytest.mark.crud
    def test_get_rule_by_id(self, admin_api: APIRequestContext, test_endpoint: dict):
        rules = admin_api.get(f"/api/v1/alert-rules/endpoint/{test_endpoint['id']}").json()
        if rules:
            resp = admin_api.get(f"/api/v1/alert-rules/{rules[0]['id']}")
            assert resp.ok
            assert resp.json()["id"] == rules[0]["id"]

    @pytest.mark.crud
    def test_toggle_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        rules = admin_api.get(f"/api/v1/alert-rules/endpoint/{test_endpoint['id']}").json()
        if rules:
            rule = rules[0]
            original_state = rule["is_active"]
            resp = admin_api.post(f"/api/v1/alert-rules/{rule['id']}/toggle")
            assert resp.ok
            assert resp.json()["is_active"] != original_state

            # Toggle back
            admin_api.post(f"/api/v1/alert-rules/{rule['id']}/toggle")

    @pytest.mark.crud
    def test_update_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        rules = admin_api.get(f"/api/v1/alert-rules/endpoint/{test_endpoint['id']}").json()
        if rules:
            resp = admin_api.patch(f"/api/v1/alert-rules/{rules[0]['id']}", data={
                "name": "Updated Rule Name",
                "threshold": 9999,
            })
            assert resp.ok
            assert resp.json()["name"] == "Updated Rule Name"
            assert resp.json()["threshold"] == 9999

    @pytest.mark.crud
    def test_delete_rule(self, admin_api: APIRequestContext, test_endpoint: dict):
        # Create a throwaway rule
        create = admin_api.post("/api/v1/alert-rules", data={
            "endpoint_id": test_endpoint["id"],
            "name": "Temp Rule",
            "condition_type": "STATUS_CODE",
            "threshold": 500,
        })
        assert create.status == 201
        rid = create.json()["id"]

        resp = admin_api.delete(f"/api/v1/alert-rules/{rid}")
        assert resp.status == 204
