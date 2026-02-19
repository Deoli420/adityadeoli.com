"""Add trust & explainability fields to anomalies table.

New columns: confidence, recommendation, ai_called, used_fallback.
All have server_defaults so existing rows are backfilled automatically.
Also widens probable_cause from varchar(1024) to text (LLM output safety).

Revision ID: 003_anomaly_trust_fields
Revises: 002_v2_endpoint_config
Create Date: 2025-02-19 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_anomaly_trust_fields"
down_revision: Union[str, None] = "002_v2_endpoint_config"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Widen probable_cause to text (was varchar(1024), LLM output can exceed)
    op.alter_column(
        "anomalies",
        "probable_cause",
        type_=sa.Text(),
        existing_type=sa.String(1024),
        existing_nullable=True,
    )

    op.add_column(
        "anomalies",
        sa.Column(
            "confidence",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "anomalies",
        sa.Column("recommendation", sa.Text(), nullable=True),
    )
    op.add_column(
        "anomalies",
        sa.Column(
            "ai_called",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "anomalies",
        sa.Column(
            "used_fallback",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("anomalies", "used_fallback")
    op.drop_column("anomalies", "ai_called")
    op.drop_column("anomalies", "recommendation")
    op.drop_column("anomalies", "confidence")

    # Revert probable_cause back to varchar(1024)
    op.alter_column(
        "anomalies",
        "probable_cause",
        type_=sa.String(1024),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
