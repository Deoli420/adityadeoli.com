import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApiEndpoint(Base):
    __tablename__ = "api_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False, default="GET")
    expected_status: Mapped[int] = mapped_column(nullable=False, default=200)
    expected_schema: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    monitoring_interval_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, default=300
    )

    # ── V2 advanced config (backward-compatible, all nullable) ────────
    query_params: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    request_headers: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    cookies: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    auth_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    body_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    advanced_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    config_version: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(  # noqa: F821
        back_populates="endpoints"
    )
    runs: Mapped[list["ApiRun"]] = relationship(  # noqa: F821
        back_populates="endpoint", passive_deletes=True, cascade="all, delete-orphan"
    )
