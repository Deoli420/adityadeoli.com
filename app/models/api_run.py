import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApiRun(Base):
    __tablename__ = "api_runs"

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
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    response_body: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_success: Mapped[bool] = mapped_column(nullable=False, default=False)
    error_message: Mapped[Optional[str]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Relationships
    endpoint: Mapped["ApiEndpoint"] = relationship(back_populates="runs")  # noqa: F821
    anomaly: Mapped[Optional["Anomaly"]] = relationship(  # noqa: F821
        back_populates="api_run", uselist=False, passive_deletes=True, cascade="all, delete-orphan"
    )
    risk_score: Mapped[Optional["RiskScore"]] = relationship(  # noqa: F821
        back_populates="api_run", uselist=False, passive_deletes=True, cascade="all, delete-orphan"
    )
