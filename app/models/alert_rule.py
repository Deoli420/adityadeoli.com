import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ConditionType(str, enum.Enum):
    """Supported alert rule condition types."""

    LATENCY_ABOVE = "LATENCY_ABOVE"
    FAILURE_COUNT = "FAILURE_COUNT"
    STATUS_CODE = "STATUS_CODE"
    SCHEMA_CHANGE = "SCHEMA_CHANGE"
    RISK_ABOVE = "RISK_ABOVE"
    SLA_BREACH = "SLA_BREACH"
    CREDENTIAL_LEAK = "CREDENTIAL_LEAK"


class AlertRule(Base):
    __tablename__ = "alert_rules"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_type: Mapped[str] = mapped_column(String(30), nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    consecutive_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    current_consecutive: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    endpoint: Mapped["ApiEndpoint"] = relationship()  # noqa: F821
    organization: Mapped["Organization"] = relationship()  # noqa: F821
