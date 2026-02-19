import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RiskScoreCreate(BaseModel):
    api_run_id: uuid.UUID
    calculated_score: float = Field(default=0.0, ge=0, le=100)
    risk_level: str = Field(default="LOW", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")


class RiskScoreRead(BaseModel):
    id: uuid.UUID
    api_run_id: uuid.UUID
    calculated_score: float
    risk_level: str
    created_at: datetime

    model_config = {"from_attributes": True}
