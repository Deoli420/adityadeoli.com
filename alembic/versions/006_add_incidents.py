"""Add incidents and incident_events tables for incident management.

New table incidents:
  - id (UUID PK)
  - endpoint_id (FK→api_endpoints)
  - organization_id (FK→organizations)
  - title (String 500)
  - status (String 20) — OPEN, INVESTIGATING, RESOLVED
  - severity (String 20) — LOW, MEDIUM, HIGH, CRITICAL
  - trigger_type (String 30) — anomaly, alert_rule, manual
  - trigger_run_id (FK→api_runs, nullable)
  - notes (Text, nullable)
  - started_at, acknowledged_at, resolved_at (DateTime tz)
  - auto_resolve_after (Integer, default 3)
  - created_at, updated_at (DateTime tz)

New table incident_events (timeline):
  - id (UUID PK)
  - incident_id (FK→incidents)
  - event_type (String 30) — created, status_change, note_added, auto_resolved
  - detail (JSON, nullable)
  - created_at (DateTime tz)

Revision ID: 006_add_incidents
Revises: 005_add_alert_rules
Create Date: 2025-02-22 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "006_add_incidents"
down_revision: Union[str, None] = "005_add_alert_rules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "incidents",
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
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="OPEN",
        ),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("trigger_type", sa.String(30), nullable=False),
        sa.Column(
            "trigger_run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("api_runs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "auto_resolve_after",
            sa.Integer(),
            nullable=False,
            server_default="3",
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

    op.create_table(
        "incident_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "incident_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("incidents.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("event_type", sa.String(30), nullable=False),
        sa.Column("detail", postgresql.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("incident_events")
    op.drop_table("incidents")
