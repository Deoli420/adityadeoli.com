"""
Real-time risk score readout returned by the monitoring pipeline.

This is distinct from ``RiskScoreRead`` (the persisted DB record).
``RiskReadout`` is the transient computation included in the
``MonitorRunResult`` response — always present, always computed.
"""

from pydantic import BaseModel, Field


class RiskReadout(BaseModel):
    """Risk score snapshot from a single monitoring run."""

    calculated_score: float = Field(default=0.0, ge=0, le=100)
    risk_level: str = Field(
        default="LOW", pattern=r"^(LOW|MEDIUM|HIGH|CRITICAL)$"
    )

    # Component breakdown for transparency
    status_score: float = Field(default=0.0, ge=0)
    performance_score: float = Field(default=0.0, ge=0)
    drift_score: float = Field(default=0.0, ge=0)
    ai_score: float = Field(default=0.0, ge=0)
    history_score: float = Field(default=0.0, ge=0)
