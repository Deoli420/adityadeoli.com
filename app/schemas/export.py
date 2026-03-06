"""Schemas for export / reporting endpoints."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    """Common export filters."""

    endpoint_ids: Optional[list[uuid.UUID]] = Field(
        default=None,
        description="Filter by specific endpoints. None = all endpoints.",
    )
    date_from: Optional[datetime] = Field(
        default=None,
        description="Start of date range (inclusive). None = no lower bound.",
    )
    date_to: Optional[datetime] = Field(
        default=None,
        description="End of date range (inclusive). None = now.",
    )


class ExportMeta(BaseModel):
    """Metadata returned alongside streamed CSV downloads."""

    export_type: str
    row_count: int
    generated_at: datetime
    filters: dict
