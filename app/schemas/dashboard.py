"""Dashboard chart schemas — response models for the 4 new dashboard endpoints."""

import uuid

from pydantic import BaseModel


class TrendPoint(BaseModel):
    """One data point in the response-time trend line (hourly bucket)."""

    hour: str  # ISO 8601 truncated to hour, e.g. "2025-02-20T14:00:00+00:00"
    avg_response_time_ms: float
    request_count: int


class ResponseTrendsResponse(BaseModel):
    points: list[TrendPoint]


class TopFailureEntry(BaseModel):
    """One row in the top-failures leaderboard."""

    endpoint_id: uuid.UUID
    endpoint_name: str
    failure_rate_percent: float
    risk_level: str  # LOW | MEDIUM | HIGH | CRITICAL
    risk_score: float


class TopFailuresResponse(BaseModel):
    endpoints: list[TopFailureEntry]


class RiskDistribution(BaseModel):
    """Count of endpoints by risk level."""

    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0


class UptimeOverviewEntry(BaseModel):
    """One row in the SLA/uptime overview widget."""

    endpoint_id: uuid.UUID
    endpoint_name: str
    uptime_percent: float
    sla_target: float
    is_breached: bool


class UptimeOverviewResponse(BaseModel):
    entries: list[UptimeOverviewEntry]
