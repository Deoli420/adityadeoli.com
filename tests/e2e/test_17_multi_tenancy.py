"""Multi-Tenancy Isolation — verify org A cannot see org B data."""

import pytest
from playwright.sync_api import APIRequestContext


class TestMultiTenantIsolation:
    @pytest.mark.multi_tenant
    def test_other_org_cannot_see_test_org_endpoints(self, other_org_api: APIRequestContext):
        """other-org admin should see zero endpoints (test-org created them all)."""
        resp = other_org_api.get("/api/v1/endpoints")
        assert resp.ok
        data = resp.json()
        # other-org has no endpoints created
        assert len(data) == 0

    @pytest.mark.multi_tenant
    def test_other_org_cannot_access_test_org_endpoint(self, other_org_api: APIRequestContext, test_endpoint: dict):
        """Direct access to test-org endpoint by other-org should return 404."""
        resp = other_org_api.get(f"/api/v1/endpoints/{test_endpoint['id']}")
        assert resp.status == 404

    @pytest.mark.multi_tenant
    def test_other_org_cannot_see_test_org_incidents(self, other_org_api: APIRequestContext):
        resp = other_org_api.get("/api/v1/incidents")
        assert resp.ok
        assert len(resp.json()) == 0

    @pytest.mark.multi_tenant
    def test_other_org_cannot_trigger_test_org_run(self, other_org_api: APIRequestContext, test_endpoint: dict):
        resp = other_org_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")
        assert resp.status == 404

    @pytest.mark.multi_tenant
    def test_other_org_has_own_dashboard(self, other_org_api: APIRequestContext):
        resp = other_org_api.get("/api/v1/dashboard/stats")
        assert resp.ok
        data = resp.json()
        assert data["total_endpoints"] == 0

    @pytest.mark.multi_tenant
    def test_other_org_can_create_own_endpoint(self, other_org_api: APIRequestContext, mock_url: str):
        resp = other_org_api.post("/api/v1/endpoints", data={
            "name": "Other Org Endpoint",
            "url": f"{mock_url}/api/healthy",
            "method": "GET",
            "expected_status": 200,
        })
        assert resp.status == 201
        eid = resp.json()["id"]

        # Verify it exists for other-org
        resp2 = other_org_api.get(f"/api/v1/endpoints/{eid}")
        assert resp2.ok

        # Clean up
        other_org_api.delete(f"/api/v1/endpoints/{eid}")
