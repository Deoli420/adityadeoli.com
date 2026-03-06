"""Add endpoint_sla table for SLA & uptime tracking.

New table endpoint_sla:
  - id (UUID PK)
  - endpoint_id (FK→api_endpoints, UNIQUE)
  - organization_id (FK→organizations)
  - sla_target_percent (Float, default 99.9)
  - uptime_window (String, default '24h')
  - is_active (Boolean, default true)
  - created_at, updated_at (DateTime tz)

Revision ID: 004_sla_and_dashboard
Revises: 003_anomaly_trust_fields
Create Date: 2025-02-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_sla_and_dashboard"
down_revision: Union[str, None] = "003_anomaly_trust_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "endpoint_sla",
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
            unique=True,
        ),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "sla_target_percent",
            sa.Float(),
            nullable=False,
            server_default="99.9",
        ),
        sa.Column(
            "uptime_window",
            sa.String(10),
            nullable=False,
            server_default="24h",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",
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
    op.drop_table("endpoint_sla")
