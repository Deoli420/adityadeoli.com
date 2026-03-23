"""Add OWNER role to user_role enum and create invites table.

Revision ID: 011_add_invites_and_owner_role
Revises: 010_add_openapi_spec
Create Date: 2026-03-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "011_add_invites_and_owner_role"
down_revision = "010_add_openapi_spec"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- 1. Add 'OWNER' to the PostgreSQL user_role enum -----------------
    # PostgreSQL cannot ALTER TYPE … ADD VALUE inside a transaction block,
    # so we need to commit the current transaction first and then execute
    # the ALTER TYPE in its own implicit auto-commit context.
    op.execute("COMMIT")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OWNER' BEFORE 'ADMIN'")

    # Start a new transaction for the remaining DDL / DML statements.
    op.execute("BEGIN")

    # -- 2. Create invites table -----------------------------------------
    op.create_table(
        "invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "OWNER", "ADMIN", "MEMBER", "VIEWER",
                name="user_role",
                create_type=False,
            ),
            nullable=False,
            server_default="MEMBER",
        ),
        sa.Column("token", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column(
            "invited_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "organization_id", "email", name="uq_invite_org_email_pending"
        ),
    )

    # -- 3. Data migration: promote first admin per org to OWNER ---------
    op.execute(
        """
        WITH first_admin AS (
            SELECT DISTINCT ON (organization_id) id
            FROM users
            WHERE role = 'ADMIN'
            ORDER BY organization_id, created_at ASC
        )
        UPDATE users
        SET role = 'OWNER'
        FROM first_admin
        WHERE users.id = first_admin.id
        """
    )


def downgrade() -> None:
    # Revert promoted OWNER users back to ADMIN
    op.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'OWNER'")

    # Drop invites table
    op.drop_table("invites")

    # NOTE: PostgreSQL does not support removing a value from an enum type.
    # The 'OWNER' value will remain in the user_role enum after downgrade.
