"""Add auth tables: organizations, users, refresh_tokens, audit_logs.
Add organization_id to api_endpoints and api_runs.

Revision ID: 001_add_auth
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_add_auth"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create organizations table
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # 2. Create users table
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(128), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=False, server_default=sa.text("''")),
        sa.Column("role", sa.String(20), nullable=False, server_default=sa.text("'MEMBER'")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("token_version", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("failed_login_attempts", sa.Integer(), nullable=False,
                  server_default=sa.text("0")),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_org_id", "users", ["organization_id"])
    op.create_unique_constraint("uq_users_email_org", "users", ["email", "organization_id"])

    # 3. Create refresh_tokens table
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    # 4. Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("detail", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    # 5. Add organization_id to api_endpoints (nullable first)
    op.add_column(
        "api_endpoints",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 6. Add organization_id to api_runs (nullable first)
    op.add_column(
        "api_runs",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    # 7. Insert default organization
    op.execute(
        """
        INSERT INTO organizations (id, name, slug, is_active)
        VALUES (gen_random_uuid(), 'SentinelAI', 'sentinelai', true)
        ON CONFLICT DO NOTHING
        """
    )

    # 8. Backfill existing rows with the default org id
    op.execute(
        """
        UPDATE api_endpoints
        SET organization_id = (SELECT id FROM organizations WHERE slug = 'sentinelai' LIMIT 1)
        WHERE organization_id IS NULL
        """
    )
    op.execute(
        """
        UPDATE api_runs
        SET organization_id = (SELECT id FROM organizations WHERE slug = 'sentinelai' LIMIT 1)
        WHERE organization_id IS NULL
        """
    )

    # 9. Make organization_id NOT NULL and add FK constraints + indexes
    op.alter_column("api_endpoints", "organization_id", nullable=False)
    op.create_foreign_key(
        "fk_api_endpoints_org_id",
        "api_endpoints", "organizations",
        ["organization_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_api_endpoints_org_id", "api_endpoints", ["organization_id"])

    op.alter_column("api_runs", "organization_id", nullable=False)
    op.create_foreign_key(
        "fk_api_runs_org_id",
        "api_runs", "organizations",
        ["organization_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_api_runs_org_id", "api_runs", ["organization_id"])


def downgrade() -> None:
    # Remove org_id from existing tables
    op.drop_index("ix_api_runs_org_id")
    op.drop_constraint("fk_api_runs_org_id", "api_runs", type_="foreignkey")
    op.drop_column("api_runs", "organization_id")

    op.drop_index("ix_api_endpoints_org_id")
    op.drop_constraint("fk_api_endpoints_org_id", "api_endpoints", type_="foreignkey")
    op.drop_column("api_endpoints", "organization_id")

    # Drop auth tables
    op.drop_table("audit_logs")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.drop_table("organizations")
