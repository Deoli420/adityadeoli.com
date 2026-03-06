"""
Schema Snapshot model — persists versioned schema snapshots for drift history.

Each row represents a unique schema shape observed for an endpoint.
When the response schema changes (detected via SHA-256 hash), a new snapshot
is created with the diff from the previous version.
"""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SchemaSnapshot(Base):
    __tablename__ = "schema_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    endpoint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_endpoints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    schema_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    schema_body: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    diff_from_previous: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    field_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
