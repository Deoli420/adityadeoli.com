"""Add ai_memory table for incident learning storage.

Revision ID: 015_add_ai_memory
Revises: 014_add_incident_clusters
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "015_add_ai_memory"
down_revision = "014_add_incident_clusters"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_memory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "endpoint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "incident_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("incidents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("signal_flags", postgresql.JSON, nullable=False),
        sa.Column("learning", sa.Text, nullable=False),
        sa.Column("resolution_action", sa.Text, nullable=True),
        sa.Column("confidence", sa.Float, nullable=False, server_default="0.8"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ai_memory_organization_id", "ai_memory", ["organization_id"])
    op.create_index("ix_ai_memory_endpoint_id", "ai_memory", ["endpoint_id"])
    op.create_index("ix_ai_memory_incident_id", "ai_memory", ["incident_id"])
    op.create_index("ix_ai_memory_fingerprint", "ai_memory", ["fingerprint"])


def downgrade() -> None:
    op.drop_index("ix_ai_memory_fingerprint", table_name="ai_memory")
    op.drop_index("ix_ai_memory_incident_id", table_name="ai_memory")
    op.drop_index("ix_ai_memory_endpoint_id", table_name="ai_memory")
    op.drop_index("ix_ai_memory_organization_id", table_name="ai_memory")
    op.drop_table("ai_memory")
