"""Add V2 advanced config columns to api_endpoints.

New nullable JSON columns for query_params, request_headers, cookies,
auth_config, body_config, advanced_config, and config_version integer.

Revision ID: 002_v2_endpoint_config
Revises: 001_add_auth
Create Date: 2025-02-16 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_v2_endpoint_config"
down_revision: Union[str, None] = "001_add_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "api_endpoints",
        sa.Column("query_params", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column("request_headers", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column("cookies", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column("auth_config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column("body_config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column("advanced_config", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "api_endpoints",
        sa.Column(
            "config_version",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade() -> None:
    op.drop_column("api_endpoints", "config_version")
    op.drop_column("api_endpoints", "advanced_config")
    op.drop_column("api_endpoints", "body_config")
    op.drop_column("api_endpoints", "auth_config")
    op.drop_column("api_endpoints", "cookies")
    op.drop_column("api_endpoints", "request_headers")
    op.drop_column("api_endpoints", "query_params")
