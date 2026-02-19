import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AnomalyCreate(BaseModel):
    api_run_id: uuid.UUID
    anomaly_detected: bool
    severity_score: float = Field(default=0.0, ge=0, le=100)
    reasoning: Optional[str] = None
    probable_cause: Optional[str] = None


class AnomalyRead(BaseModel):
    id: uuid.UUID
    api_run_id: uuid.UUID
    anomaly_detected: bool
    severity_score: float
    reasoning: Optional[str]
    probable_cause: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
