import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SecurityFinding(Base):
    """
    A credential leak or sensitive data finding detected during a pipeline run.

    Each row represents one occurrence of a specific pattern (e.g. AWS key,
    JWT token, password field) found in the response body of an API run.
    """

    __tablename__ = "security_findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    api_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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

    # What was found
    finding_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # e.g. AWS_KEY, JWT, PASSWORD, PRIVATE_KEY, GENERIC_API_KEY
    pattern_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # human-readable pattern name
    field_path: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )  # JSON path where found (best-effort)
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="HIGH"
    )  # CRITICAL, HIGH, MEDIUM, LOW
    redacted_preview: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # shows first/last chars with asterisks

    # Match count — how many instances of this pattern in the response
    match_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
