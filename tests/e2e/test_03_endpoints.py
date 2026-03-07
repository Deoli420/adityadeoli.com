"""Endpoint CRUD — create, read, update, delete API endpoints."""

import pytest
from playwright.sync_api import APIRequestContext


class TestCreateEndpoint:
    @pytest.mark.crud
    def test_create_minimal_endpoint(self, admin_api: APIRequestContext, mock_url: str):
        resp = admin_api.post("/api/v1/endpoints", data={
            "name": "Minimal Endpoint",
            "url": f"{mock_url}/api/healthy",
            "method": "GET",
            "expected_status": 200,
        })
        assert resp.status == 201
        data = resp.json()
        assert data["name"] == "Minimal Endpoint"
        assert data["method"] == "GET"
        assert data["expected_status"] == 200
        assert data["monitoring_interval_seconds"] == 300  # default
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.crud
    def test_create_endpoint_with_full_v2_config(self, admin_api: APIRequestContext, mock_url: str):
        resp = admin_api.post("/api/v1/endpoints", data={
            "name": "Full V2 Endpoint",
            "url": f"{mock_url}/api/echo",
            "method": "POST",
            "expected_status": 200,
            "monitoring_interval_seconds": 60,
            "expected_schema": {"status": "string", "method": "string"},
            "query_params": [{"key": "page", "value": "1", "enabled": True}],
            "request_headers": [{"key": "X-Custom", "value": "test", "enabled": True}],
            "auth_config": {"type": "bearer", "bearer": {"token": "test-token-123"}},
            "body_config": {"type": "json", "raw": '{"test": true}'},
            "advanced_config": {"timeout_ms": 10000, "retries": 2, "follow_redirects": True},
        })
        assert resp.status == 201
        data = resp.json()
        assert data["method"] == "POST"
        assert data["query_params"] is not None
        assert data["auth_config"]["type"] == "bearer"

    @pytest.mark.crud
    def test_create_endpoint_invalid_url(self, admin_api: APIRequestContext):
        resp = admin_api.post("/api/v1/endpoints", data={
            "name": "Bad URL",
            "url": "not-a-valid-url",
            "method": "GET",
        })
        assert resp.status == 422

    @pytest.mark.crud
    def test_create_endpoint_requires_auth(self, api: APIRequestContext, mock_url: str):
        resp = api.post("/api/v1/endpoints", data={
            "name": "Unauthed",
            "url": f"{mock_url}/api/healthy",
        })
        assert resp.status == 401


class TestReadEndpoints:
    @pytest.mark.crud
    def test_list_endpoints(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/endpoints")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.crud
    def test_get_endpoint_by_id(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.get(f"/api/v1/endpoints/{test_endpoint['id']}")
        assert resp.ok
        assert resp.json()["id"] == test_endpoint["id"]

    @pytest.mark.crud
    def test_get_nonexistent_endpoint(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/endpoints/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404


class TestUpdateEndpoint:
    @pytest.mark.crud
    def test_update_endpoint_name(self, admin_api: APIRequestContext, mock_url: str):
        # Create an endpoint to update
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "To Be Updated",
            "url": f"{mock_url}/api/healthy",
            "method": "GET",
            "expected_status": 200,
        })
        assert create.status == 201
        eid = create.json()["id"]

        resp = admin_api.patch(f"/api/v1/endpoints/{eid}", data={"name": "Updated Name"})
        assert resp.ok
        assert resp.json()["name"] == "Updated Name"

    @pytest.mark.crud
    def test_update_endpoint_monitoring_interval(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.patch(f"/api/v1/endpoints/{test_endpoint['id']}", data={
            "monitoring_interval_seconds": 120,
        })
        assert resp.ok
        assert resp.json()["monitoring_interval_seconds"] == 120


class TestDeleteEndpoint:
    @pytest.mark.crud
    def test_delete_endpoint(self, admin_api: APIRequestContext, mock_url: str):
        # Create a throwaway endpoint
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "To Be Deleted",
            "url": f"{mock_url}/api/healthy",
            "method": "GET",
            "expected_status": 200,
        })
        assert create.status == 201
        eid = create.json()["id"]

        resp = admin_api.delete(f"/api/v1/endpoints/{eid}")
        assert resp.status == 204

        # Verify it's gone
        resp = admin_api.get(f"/api/v1/endpoints/{eid}")
        assert resp.status == 404

    @pytest.mark.crud
    def test_delete_nonexistent_endpoint(self, admin_api: APIRequestContext):
        resp = admin_api.delete("/api/v1/endpoints/00000000-0000-0000-0000-000000000000")
        assert resp.status == 404
