from typing import Any, Optional

from pydantic import BaseModel


class FieldDifference(BaseModel):
    path: str
    expected_type: Optional[str] = None
    actual_type: Optional[str] = None


class SchemaDriftReadout(BaseModel):
    """Schema drift analysis for an API response."""

    has_drift: bool = False
    total_differences: int = 0
    missing_fields: list[FieldDifference] = []
    new_fields: list[FieldDifference] = []
    type_mismatches: list[FieldDifference] = []
    skipped_reason: Optional[str] = None
