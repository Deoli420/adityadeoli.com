"""
Real-time anomaly analysis readout returned by the monitoring pipeline.

This is distinct from ``AnomalyRead`` (which is the persisted DB record).
``AnomalyReadout`` is the transient AI analysis result included in the
``MonitorRunResult`` response — it may or may not be persisted depending
on whether an anomaly was detected.
"""

from typing import Optional

from pydantic import BaseModel, Field


class AnomalyReadout(BaseModel):
    """AI anomaly analysis snapshot from a single monitoring run."""

    anomaly_detected: bool = False
    severity_score: float = Field(default=0.0, ge=0, le=100)
    reasoning: str = ""
    probable_cause: str = ""
    skipped_reason: Optional[str] = None
    ai_called: bool = False
