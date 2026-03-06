"""Add ai_telemetry table for LLM usage tracking.

New table ai_telemetry:
  - id (UUID PK)
  - endpoint_id (FK→api_endpoints)
  - organization_id (FK→organizations)
  - model_name (String 100)
  - prompt_tokens, completion_tokens, total_tokens (Integer)
  - latency_ms (Float)
  - success (Boolean)
  - cost_usd (Float)
  - error_message (String 500, nullable)
  - created_at (DateTime tz)

Revision ID: 007_add_ai_telemetry
Revises: 006_add_incidents
Create Date: 2025-02-23 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "007_add_ai_telemetry"
down_revision: Union[str, None] = "006_add_incidents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_telemetry",
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
        sa.Column("model_name", sa.String(100), nullable=False),
        sa.Column(
            "prompt_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "completion_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "total_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "latency_ms", sa.Float(), nullable=False, server_default="0"
        ),
        sa.Column(
            "success",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "cost_usd", sa.Float(), nullable=False, server_default="0"
        ),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("ai_telemetry")
