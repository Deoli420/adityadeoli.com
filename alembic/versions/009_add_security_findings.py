"""Add security_findings table for credential leak detection.

Revision ID: 009_add_security_findings
Revises: 008_add_schema_snapshots
Create Date: 2025-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009_add_security_findings"
down_revision = "008_add_schema_snapshots"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "security_findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "api_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_runs.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
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
        sa.Column("finding_type", sa.String(50), nullable=False),
        sa.Column("pattern_name", sa.String(100), nullable=False),
        sa.Column("field_path", sa.String(500), nullable=True),
        sa.Column("severity", sa.String(20), nullable=False, server_default="HIGH"),
        sa.Column("redacted_preview", sa.Text, nullable=True),
        sa.Column("match_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("security_findings")
