"""Add incident clusters table and cluster_id to incidents.

Revision ID: 014_add_incident_clusters
Revises: 013_add_incident_narrative
Create Date: 2026-03-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "014_add_incident_clusters"
down_revision = "013_add_incident_narrative"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "incident_clusters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("shared_signals", postgresql.JSON, nullable=False),
        sa.Column("root_cause_summary", sa.Text, nullable=True),
        sa.Column(
            "merged_into_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("incident_clusters.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.add_column(
        "incidents",
        sa.Column(
            "cluster_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("incident_clusters.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_incidents_cluster_id", "incidents", ["cluster_id"])


def downgrade() -> None:
    op.drop_index("ix_incidents_cluster_id", table_name="incidents")
    op.drop_column("incidents", "cluster_id")
    op.drop_table("incident_clusters")
