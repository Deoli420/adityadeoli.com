"""Add schema_snapshots table for schema drift versioning.

New table schema_snapshots:
  - id (UUID PK)
  - endpoint_id (FK->api_endpoints)
  - organization_id (FK->organizations)
  - schema_hash (String 64)
  - schema_body (JSON)
  - diff_from_previous (JSON, nullable)
  - field_count (Integer)
  - created_at (DateTime tz)

Revision ID: 008_add_schema_snapshots
Revises: 007_add_ai_telemetry
Create Date: 2025-03-01 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "008_add_schema_snapshots"
down_revision: Union[str, None] = "007_add_ai_telemetry"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "schema_snapshots",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
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
        sa.Column("schema_hash", sa.String(64), nullable=False),
        sa.Column("schema_body", postgresql.JSON(), nullable=False),
        sa.Column("diff_from_previous", postgresql.JSON(), nullable=True),
        sa.Column(
            "field_count", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("schema_snapshots")
