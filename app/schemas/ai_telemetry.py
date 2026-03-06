"""AI Telemetry schemas — response models for the telemetry dashboard API."""

import uuid
from datetime import datetime

from pydantic import BaseModel


# ── Stats aggregate ──────────────────────────────────────────────────────────


class AiTelemetryStats(BaseModel):
    """Aggregate KPIs across all AI calls for the tenant."""

    total_calls: int
    successful_calls: int
    failed_calls: int
    total_tokens: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_cost_usd: float
    avg_latency_ms: float
    avg_tokens_per_call: float


class AiTelemetryStatsResponse(BaseModel):
    stats: AiTelemetryStats


# ── Daily breakdown ──────────────────────────────────────────────────────────


class DailyBreakdownPoint(BaseModel):
    """One day of AI usage — for the daily time-series chart."""

    date: str  # ISO date, e.g. "2025-02-20"
    calls: int
    tokens: int
    cost_usd: float
    avg_latency_ms: float


class DailyBreakdownResponse(BaseModel):
    points: list[DailyBreakdownPoint]


# ── Per-endpoint usage ───────────────────────────────────────────────────────


class PerEndpointUsage(BaseModel):
    """AI usage ranked by endpoint — for the cost-by-endpoint chart."""

    endpoint_id: uuid.UUID
    endpoint_name: str
    total_calls: int
    total_tokens: int
    total_cost_usd: float
    avg_latency_ms: float
    success_rate: float


class PerEndpointUsageResponse(BaseModel):
    endpoints: list[PerEndpointUsage]


# ── Health ───────────────────────────────────────────────────────────────────


class AiHealthResponse(BaseModel):
    """LLM health metrics — success rate, error rate, recent errors."""

    total_calls: int
    success_rate: float
    error_rate: float
    avg_latency_ms: float
    last_error: str | None
    last_error_at: datetime | None
    model_name: str
