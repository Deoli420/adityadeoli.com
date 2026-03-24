"""Add incident narrative column.

Revision ID: 013_add_incident_narrative
Revises: 012_add_incident_fingerprinting
Create Date: 2026-03-25
"""

from alembic import op
import sqlalchemy as sa

revision = "013_add_incident_narrative"
down_revision = "012_add_incident_fingerprinting"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "incidents",
        sa.Column("narrative", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("incidents", "narrative")
