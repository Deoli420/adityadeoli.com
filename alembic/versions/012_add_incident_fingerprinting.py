"""Add incident fingerprinting support.

Revision ID: 012_add_incident_fingerprinting
Revises: 011_add_invites_and_owner_role
Create Date: 2026-03-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "012_add_incident_fingerprinting"
down_revision = "011_add_invites_and_owner_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- 1. Add fingerprint column to incidents table ----------------------
    op.add_column(
        "incidents",
        sa.Column("fingerprint", sa.String(64), nullable=True),
    )
    op.create_index("ix_incidents_fingerprint", "incidents", ["fingerprint"])

    # -- 2. Create incident_fingerprint_cache table ------------------------
    op.create_table(
        "incident_fingerprint_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("fingerprint", sa.String(64), nullable=False, index=True),
        sa.Column(
            "endpoint_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("signal_flags", postgresql.JSON, nullable=False),
        sa.Column("occurrence_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("avg_resolution_ms", sa.BigInteger, nullable=True),
        sa.Column("last_resolution_notes", sa.Text, nullable=True),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "fingerprint", "endpoint_id", name="uq_fingerprint_endpoint"
        ),
    )


def downgrade() -> None:
    op.drop_table("incident_fingerprint_cache")
    op.drop_index("ix_incidents_fingerprint", table_name="incidents")
    op.drop_column("incidents", "fingerprint")
