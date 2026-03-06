"""Add openapi_spec JSONB column to api_endpoints.

Revision ID: 010_add_openapi_spec
Revises: 009_add_security_findings
Create Date: 2025-01-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "010_add_openapi_spec"
down_revision = "009_add_security_findings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "api_endpoints",
        sa.Column("openapi_spec", postgresql.JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("api_endpoints", "openapi_spec")
