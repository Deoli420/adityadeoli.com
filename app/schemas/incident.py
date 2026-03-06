import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    endpoint_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=500)
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    trigger_type: str = Field(default="manual", pattern="^(anomaly|alert_rule|manual)$")
    trigger_run_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    auto_resolve_after: int = Field(default=3, ge=1, le=50)


class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|INVESTIGATING|RESOLVED)$")


class IncidentNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=5000)


class IncidentEventRead(BaseModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    event_type: str
    detail: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentRead(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    status: str
    severity: str
    trigger_type: str
    trigger_run_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    started_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    auto_resolve_after: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentListItem(BaseModel):
    """Lightweight incident for list views — includes endpoint_name."""
    id: uuid.UUID
    endpoint_id: uuid.UUID
    title: str
    status: str
    severity: str
    trigger_type: str
    started_at: datetime
    resolved_at: Optional[datetime] = None
    endpoint_name: str = ""

    model_config = {"from_attributes": True}
