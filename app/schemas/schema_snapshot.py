"""Schema Snapshot schemas — response models for the schema history API."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


# ── Single snapshot response ─────────────────────────────────────────────────


class SchemaSnapshotResponse(BaseModel):
    """One schema snapshot — used in lists and detail views."""

    id: uuid.UUID
    endpoint_id: uuid.UUID
    schema_hash: str
    field_count: int
    diff_summary: dict[str, Any] | None = None
    created_at: datetime


# ── History list ─────────────────────────────────────────────────────────────


class SchemaHistoryResponse(BaseModel):
    """Chronological list of schema snapshots for an endpoint."""

    snapshots: list[SchemaSnapshotResponse]


# ── Diff comparison ──────────────────────────────────────────────────────────


class SchemaDiffResponse(BaseModel):
    """Side-by-side comparison result of two schema snapshots."""

    snapshot_a_id: uuid.UUID
    snapshot_b_id: uuid.UUID
    diff: dict[str, Any]
