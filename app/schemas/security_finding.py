"""Pydantic schemas for security findings API responses."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class SecurityFindingResponse(BaseModel):
    id: str
    api_run_id: str
    endpoint_id: str
    finding_type: str
    pattern_name: str
    field_path: str | None = None
    severity: str
    redacted_preview: str | None = None
    match_count: int = 1
    created_at: datetime


class TypeBreakdown(BaseModel):
    type: str
    count: int


class SeverityBreakdown(BaseModel):
    severity: str
    count: int


class SecurityStatsResponse(BaseModel):
    total_findings: int
    by_type: list[TypeBreakdown]
    by_severity: list[SeverityBreakdown]
    affected_endpoints: int
    period_days: int
