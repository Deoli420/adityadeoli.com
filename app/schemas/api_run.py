import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ApiRunCreate(BaseModel):
    endpoint_id: uuid.UUID
    status_code: Optional[int] = Field(None, ge=100, le=599)
    response_time_ms: Optional[float] = Field(None, ge=0)
    response_body: Optional[dict[str, Any]] = None
    is_success: bool = False
    error_message: Optional[str] = None


class ApiRunRead(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    status_code: Optional[int]
    response_time_ms: Optional[float]
    response_body: Optional[dict[str, Any]]
    is_success: bool
    error_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiRunSummary(BaseModel):
    """Lightweight projection for list views — no response body."""

    id: uuid.UUID
    endpoint_id: uuid.UUID
    status_code: Optional[int]
    response_time_ms: Optional[float]
    is_success: bool
    created_at: datetime

    model_config = {"from_attributes": True}
