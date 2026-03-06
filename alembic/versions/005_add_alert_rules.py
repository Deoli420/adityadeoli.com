"""Add alert_rules table for custom per-endpoint alert rules.

New table alert_rules:
  - id (UUID PK)
  - endpoint_id (FK→api_endpoints)
  - organization_id (FK→organizations)
  - name (String 255)
  - condition_type (String 30) — LATENCY_ABOVE, FAILURE_COUNT, STATUS_CODE,
    SCHEMA_CHANGE, RISK_ABOVE, SLA_BREACH
  - threshold (Float)
  - consecutive_count (Integer, default 1)
  - current_consecutive (Integer, default 0)
  - is_active (Boolean, default true)
  - last_triggered_at (DateTime tz, nullable)
  - created_at, updated_at (DateTime tz)

Revision ID: 005_add_alert_rules
Revises: 004_sla_and_dashboard
Create Date: 2025-02-21 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005_add_alert_rules"
down_revision: Union[str, None] = "004_sla_and_dashboard"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "alert_rules",
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
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("condition_type", sa.String(30), nullable=False),
        sa.Column("threshold", sa.Float(), nullable=False),
        sa.Column(
            "consecutive_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "current_consecutive",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),
        sa.Column(
            "last_triggered_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("alert_rules")
