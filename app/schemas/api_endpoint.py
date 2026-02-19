import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl


# ── V2 Sub-schemas (advanced endpoint configuration) ─────────────────────


class KeyValueRow(BaseModel):
    """A single key-value pair used in params, headers, cookies."""

    key: str = ""
    value: str = ""
    enabled: bool = True


class AuthConfigSchema(BaseModel):
    """Auth configuration stored on the endpoint."""

    type: str = Field(
        default="none", pattern="^(none|bearer|basic|api-key)$"
    )
    bearer: Optional[dict[str, str]] = None  # {"token": "..."}
    basic: Optional[dict[str, str]] = None  # {"username": "...", "password": "..."}
    api_key: Optional[dict[str, str]] = None  # {"key": "...", "value": "...", "addTo": "header|query"}


class BodyConfigSchema(BaseModel):
    """Body configuration stored on the endpoint."""

    type: str = Field(
        default="none",
        pattern="^(none|json|form-data|x-www-form-urlencoded)$",
    )
    raw: Optional[str] = None  # JSON string for raw mode
    form_fields: Optional[list[KeyValueRow]] = None  # form-data / urlencoded


class AdvancedConfigSchema(BaseModel):
    """Advanced request configuration."""

    timeout_ms: int = Field(default=30000, ge=1000, le=120000)
    retries: int = Field(default=0, ge=0, le=5)
    retry_delay_ms: int = Field(default=1000, ge=0, le=30000)
    follow_redirects: bool = True
    expected_response_time_ms: Optional[int] = Field(default=None, ge=0, le=120000)


# ── Core schemas ─────────────────────────────────────────────────────────


class ApiEndpointCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: HttpUrl
    method: str = Field(default="GET", pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    expected_status: int = Field(default=200, ge=100, le=599)
    expected_schema: Optional[dict[str, Any]] = None
    monitoring_interval_seconds: int = Field(default=300, ge=10, le=86400)

    # V2 fields (optional, backward-compatible)
    query_params: Optional[list[KeyValueRow]] = None
    request_headers: Optional[list[KeyValueRow]] = None
    cookies: Optional[list[KeyValueRow]] = None
    auth_config: Optional[AuthConfigSchema] = None
    body_config: Optional[BodyConfigSchema] = None
    advanced_config: Optional[AdvancedConfigSchema] = None


class ApiEndpointUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[HttpUrl] = None
    method: Optional[str] = Field(None, pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    expected_status: Optional[int] = Field(None, ge=100, le=599)
    expected_schema: Optional[dict[str, Any]] = None
    monitoring_interval_seconds: Optional[int] = Field(None, ge=10, le=86400)

    # V2 fields (optional)
    query_params: Optional[list[KeyValueRow]] = None
    request_headers: Optional[list[KeyValueRow]] = None
    cookies: Optional[list[KeyValueRow]] = None
    auth_config: Optional[AuthConfigSchema] = None
    body_config: Optional[BodyConfigSchema] = None
    advanced_config: Optional[AdvancedConfigSchema] = None


class ApiEndpointRead(BaseModel):
    id: uuid.UUID
    name: str
    url: str
    method: str
    expected_status: int
    expected_schema: Optional[dict[str, Any]] = None
    monitoring_interval_seconds: int

    # V2 fields
    query_params: Optional[list[dict[str, Any]]] = None
    request_headers: Optional[list[dict[str, Any]]] = None
    cookies: Optional[list[dict[str, Any]]] = None
    auth_config: Optional[dict[str, Any]] = None
    body_config: Optional[dict[str, Any]] = None
    advanced_config: Optional[dict[str, Any]] = None
    config_version: int = 1

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
