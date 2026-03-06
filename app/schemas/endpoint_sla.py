import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EndpointSLACreate(BaseModel):
    endpoint_id: uuid.UUID
    sla_target_percent: float = Field(default=99.9, ge=0.0, le=100.0)
    uptime_window: str = Field(default="24h", pattern=r"^(24h|7d|30d)$")


class EndpointSLAUpdate(BaseModel):
    sla_target_percent: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    uptime_window: Optional[str] = Field(default=None, pattern=r"^(24h|7d|30d)$")
    is_active: Optional[bool] = None


class EndpointSLARead(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    organization_id: uuid.UUID
    sla_target_percent: float
    uptime_window: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UptimeStats(BaseModel):
    endpoint_id: uuid.UUID
    uptime_percent: float
    total_runs: int
    successful_runs: int
    window: str
    sla_target: float
    is_breached: bool
