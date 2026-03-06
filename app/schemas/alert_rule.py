import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AlertRuleCreate(BaseModel):
    endpoint_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    condition_type: str = Field(
        ...,
        pattern="^(LATENCY_ABOVE|FAILURE_COUNT|STATUS_CODE|SCHEMA_CHANGE|RISK_ABOVE|SLA_BREACH)$",
    )
    threshold: float = Field(..., ge=0)
    consecutive_count: int = Field(default=1, ge=1, le=100)


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    condition_type: Optional[str] = Field(
        default=None,
        pattern="^(LATENCY_ABOVE|FAILURE_COUNT|STATUS_CODE|SCHEMA_CHANGE|RISK_ABOVE|SLA_BREACH)$",
    )
    threshold: Optional[float] = Field(default=None, ge=0)
    consecutive_count: Optional[int] = Field(default=None, ge=1, le=100)
    is_active: Optional[bool] = None


class AlertRuleRead(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    condition_type: str
    threshold: float
    consecutive_count: int
    current_consecutive: int
    is_active: bool
    last_triggered_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
