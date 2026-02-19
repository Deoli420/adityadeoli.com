import uuid

from fastapi import HTTPException, status

from app.models.api_endpoint import ApiEndpoint
from app.repositories.api_endpoint import ApiEndpointRepository
from app.schemas.api_endpoint import ApiEndpointCreate, ApiEndpointUpdate


class ApiEndpointService:
    def __init__(self, repo: ApiEndpointRepository) -> None:
        self._repo = repo

    async def list_endpoints(self, tenant_id: uuid.UUID) -> list[ApiEndpoint]:
        return await self._repo.get_all(tenant_id)

    async def get_endpoint(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> ApiEndpoint:
        endpoint = await self._repo.get_by_id(endpoint_id, tenant_id)
        if endpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API endpoint {endpoint_id} not found",
            )
        return endpoint

    async def create_endpoint(
        self, data: ApiEndpointCreate, tenant_id: uuid.UUID
    ) -> ApiEndpoint:
        # Serialize V2 sub-schemas to plain dicts for JSON columns
        query_params = (
            [row.model_dump() for row in data.query_params]
            if data.query_params
            else None
        )
        request_headers = (
            [row.model_dump() for row in data.request_headers]
            if data.request_headers
            else None
        )
        cookies = (
            [row.model_dump() for row in data.cookies]
            if data.cookies
            else None
        )
        auth_config = (
            data.auth_config.model_dump() if data.auth_config else None
        )
        body_config = (
            data.body_config.model_dump() if data.body_config else None
        )
        advanced_config = (
            data.advanced_config.model_dump() if data.advanced_config else None
        )

        # Determine config version based on whether V2 fields are present
        has_v2 = any([
            query_params, request_headers, cookies,
            auth_config, body_config, advanced_config,
        ])

        endpoint = ApiEndpoint(
            organization_id=tenant_id,
            name=data.name,
            url=str(data.url),
            method=data.method.upper(),
            expected_status=data.expected_status,
            expected_schema=data.expected_schema,
            monitoring_interval_seconds=data.monitoring_interval_seconds,
            # V2 fields
            query_params=query_params,
            request_headers=request_headers,
            cookies=cookies,
            auth_config=auth_config,
            body_config=body_config,
            advanced_config=advanced_config,
            config_version=2 if has_v2 else 1,
        )
        return await self._repo.create(endpoint)

    async def update_endpoint(
        self, endpoint_id: uuid.UUID, data: ApiEndpointUpdate, tenant_id: uuid.UUID
    ) -> ApiEndpoint:
        endpoint = await self.get_endpoint(endpoint_id, tenant_id)
        update_fields = data.model_dump(exclude_unset=True)

        for field, value in update_fields.items():
            if field == "url" and value is not None:
                value = str(value)
            if field == "method" and value is not None:
                value = value.upper()
            # Serialize V2 Pydantic sub-schemas to dicts for JSON columns
            if field in ("query_params", "request_headers", "cookies") and value is not None:
                value = [
                    row.model_dump() if hasattr(row, "model_dump") else row
                    for row in value
                ]
            if field in ("auth_config", "body_config", "advanced_config") and value is not None:
                value = value.model_dump() if hasattr(value, "model_dump") else value
            setattr(endpoint, field, value)

        # Bump to config_version 2 if any V2 field is now set
        v2_fields = ["query_params", "request_headers", "cookies",
                      "auth_config", "body_config", "advanced_config"]
        if any(getattr(endpoint, f, None) for f in v2_fields):
            endpoint.config_version = 2

        return await self._repo.update(endpoint)

    async def delete_endpoint(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        endpoint = await self.get_endpoint(endpoint_id, tenant_id)
        await self._repo.delete(endpoint)
