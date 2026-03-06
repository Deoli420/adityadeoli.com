"""Pydantic schemas for contract validation API responses."""

from __future__ import annotations

from pydantic import BaseModel


class ViolationResponse(BaseModel):
    rule: str
    path: str
    message: str
    severity: str


class ContractValidationResponse(BaseModel):
    has_violations: bool
    total_violations: int
    violations: list[ViolationResponse]


class SpecUploadResponse(BaseModel):
    message: str
    endpoint_id: str
    paths_count: int
