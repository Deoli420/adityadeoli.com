"""
Seed script — creates the default organization and admin user.

Usage:
    python -m scripts.seed

Environment variables:
    ADMIN_EMAIL     — admin email  (default: admin@sentinelai.com)
    ADMIN_PASSWORD  — admin password (required, no default)
"""

import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Ensure the project root is on sys.path when run as `python -m scripts.seed`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session_factory, engine  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.services.auth import AuthService  # noqa: E402

# Also import all models so Base.metadata is fully populated
import app.models.api_endpoint  # noqa: F401, E402
import app.models.api_run  # noqa: F401, E402
import app.models.anomaly  # noqa: F401, E402
import app.models.risk_score  # noqa: F401, E402
import app.models.refresh_token  # noqa: F401, E402
import app.models.audit_log  # noqa: F401, E402


DEFAULT_ORG_NAME = "SentinelAI"
DEFAULT_ORG_SLUG = "sentinelai"
DEFAULT_ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@sentinelai.com")
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
DEFAULT_ADMIN_DISPLAY_NAME = "Admin"


async def seed(session: AsyncSession) -> None:
    # 1. Ensure default organization exists
    result = await session.execute(
        select(Organization).where(Organization.slug == DEFAULT_ORG_SLUG)
    )
    org = result.scalar_one_or_none()

    if org is None:
        org = Organization(name=DEFAULT_ORG_NAME, slug=DEFAULT_ORG_SLUG)
        session.add(org)
        await session.flush()
        print(f"Created organization: {org.name} (slug={org.slug}, id={org.id})")
    else:
        print(f"Organization already exists: {org.name} (id={org.id})")

    # 2. Ensure admin user exists
    result = await session.execute(
        select(User).where(
            User.email == DEFAULT_ADMIN_EMAIL,
            User.organization_id == org.id,
        )
    )
    admin = result.scalar_one_or_none()

    if admin is None:
        if not DEFAULT_ADMIN_PASSWORD:
            print(
                "ERROR: ADMIN_PASSWORD environment variable is required "
                "to create the admin user."
            )
            sys.exit(1)

        password_hash = AuthService.hash_password(DEFAULT_ADMIN_PASSWORD)
        admin = User(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=password_hash,
            display_name=DEFAULT_ADMIN_DISPLAY_NAME,
            role=UserRole.ADMIN,
            organization_id=org.id,
        )
        session.add(admin)
        await session.flush()
        print(f"Created admin user: {admin.email} (id={admin.id})")
    else:
        print(f"Admin user already exists: {admin.email} (id={admin.id})")

    # 3. Backfill organization_id on existing api_endpoints and api_runs
    from app.models.api_endpoint import ApiEndpoint
    from app.models.api_run import ApiRun

    # Backfill endpoints without organization_id
    result = await session.execute(
        select(ApiEndpoint).where(ApiEndpoint.organization_id.is_(None))
    )
    orphan_endpoints = list(result.scalars().all())
    if orphan_endpoints:
        for ep in orphan_endpoints:
            ep.organization_id = org.id
        await session.flush()
        print(f"Backfilled {len(orphan_endpoints)} endpoints with org_id={org.id}")

    # Backfill runs without organization_id
    result = await session.execute(
        select(ApiRun).where(ApiRun.organization_id.is_(None))
    )
    orphan_runs = list(result.scalars().all())
    if orphan_runs:
        for run in orphan_runs:
            run.organization_id = org.id
        await session.flush()
        print(f"Backfilled {len(orphan_runs)} runs with org_id={org.id}")

    await session.commit()
    print("Seed complete.")


async def main() -> None:
    # Create tables if they don't exist (for fresh DBs)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        await seed(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
