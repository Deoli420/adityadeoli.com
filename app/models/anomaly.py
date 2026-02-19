import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    api_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    anomaly_detected: Mapped[bool] = mapped_column(nullable=False)
    severity_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    probable_cause: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    api_run: Mapped["ApiRun"] = relationship(back_populates="anomaly")  # noqa: F821
