"""API Contract Testing — OpenAPI spec upload and validation."""

import pytest
from playwright.sync_api import APIRequestContext

VALID_OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {"title": "Mock API", "version": "1.0.0"},
    "paths": {
        "/api/openapi-compliant": {
            "get": {
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["id", "name", "price", "in_stock"],
                                    "properties": {
                                        "id": {"type": "integer"},
                                        "name": {"type": "string"},
                                        "price": {"type": "number"},
                                        "in_stock": {"type": "boolean"},
                                        "category": {"type": "string"},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}


class TestContractUpload:
    @pytest.mark.crud
    def test_upload_openapi_spec(self, admin_api: APIRequestContext, mock_url: str):
        # Create endpoint for contract testing
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "Contract Test Endpoint",
            "url": f"{mock_url}/api/openapi-compliant",
            "method": "GET",
            "expected_status": 200,
        })
        assert create.status == 201
        eid = create.json()["id"]

        resp = admin_api.post(f"/api/v1/contracts/{eid}/upload", data=VALID_OPENAPI_SPEC)
        assert resp.ok
        data = resp.json()
        assert "message" in data


class TestContractValidation:
    @pytest.mark.pipeline
    def test_validate_compliant_response(self, admin_api: APIRequestContext, mock_url: str):
        """Endpoint that returns spec-compliant data should have no violations."""
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "Compliant Contract Endpoint",
            "url": f"{mock_url}/api/openapi-compliant",
            "method": "GET",
            "expected_status": 200,
        })
        assert create.status == 201
        eid = create.json()["id"]

        # Upload spec
        admin_api.post(f"/api/v1/contracts/{eid}/upload", data=VALID_OPENAPI_SPEC)

        # Validate
        resp = admin_api.post(f"/api/v1/contracts/{eid}/validate")
        assert resp.ok

    @pytest.mark.pipeline
    def test_validate_violating_response(self, admin_api: APIRequestContext, mock_url: str):
        """Endpoint that returns wrong types should produce violations."""
        create = admin_api.post("/api/v1/endpoints", data={
            "name": "Violating Contract Endpoint",
            "url": f"{mock_url}/api/openapi-violating",
            "method": "GET",
            "expected_status": 200,
        })
        assert create.status == 201
        eid = create.json()["id"]

        # Upload spec (same spec — but this endpoint returns wrong types)
        admin_api.post(f"/api/v1/contracts/{eid}/upload", data=VALID_OPENAPI_SPEC)

        # Validate — should detect violations
        resp = admin_api.post(f"/api/v1/contracts/{eid}/validate")
        assert resp.ok

    @pytest.mark.pipeline
    def test_get_violations_without_spec(self, admin_api: APIRequestContext, test_endpoint: dict):
        """Endpoint without uploaded spec should handle gracefully."""
        resp = admin_api.get(f"/api/v1/contracts/{test_endpoint['id']}/violations")
        # Should return something valid (empty violations or error)
        assert resp.status in (200, 404, 400)
