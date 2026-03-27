"""
Integration test fixtures for SentinelAI.

Uses httpx.AsyncClient with FastAPI app + SQLite in-memory database.
Each test runs in an isolated session that rolls back automatically.

Key design decisions:
  - Override get_session dependency to inject test DB session
  - Bypass the app lifespan (scheduler, LLM, webhook, api_runner) by
    building a fresh FastAPI instance with no lifespan
  - Use SQLite + aiosqlite for speed; skip PG-only queries in tests
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# ---------------------------------------------------------------------------
# Ensure the project root is importable
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
sys.path.insert(0, PROJECT_ROOT)

# Override environment BEFORE any app import so pydantic-settings picks them up
os.environ.update(
    {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "test",
        "DB_PASSWORD": "test",
        "DB_NAME": "test_db",
        "SECRET_KEY": "test-secret-key-for-integration-tests",
        "DEBUG": "false",
        "OPENAI_API_KEY": "",
        "AI_ENABLED": "false",
        "SCHEDULER_ENABLED": "false",
        "WEBHOOK_ENABLED": "false",
        "RATE_LIMIT_ENABLED": "false",
        "FRONTEND_ORIGIN": "http://localhost:3000",
    }
)

from app.db.base import Base
from app.db.session import get_session
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.services.auth import AuthService

# ---------------------------------------------------------------------------
# Import all models so Base.metadata is fully populated
# ---------------------------------------------------------------------------
import app.models.api_endpoint  # noqa: F401
import app.models.api_run  # noqa: F401
import app.models.anomaly  # noqa: F401
import app.models.risk_score  # noqa: F401
import app.models.organization  # noqa: F401
import app.models.user  # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.audit_log  # noqa: F401
import app.models.endpoint_sla  # noqa: F401
import app.models.incident  # noqa: F401
import app.models.alert_rule  # noqa: F401
import app.models.schema_snapshot  # noqa: F401
import app.models.security_finding  # noqa: F401
import app.models.ai_telemetry  # noqa: F401
import app.models.invite  # noqa: F401
import app.models.incident_cluster  # noqa: F401
import app.models.fingerprint_cache  # noqa: F401
import app.models.ai_memory  # noqa: F401

# ---------------------------------------------------------------------------
# Test database engine (SQLite in-memory, shared across connections)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite://"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# ---------------------------------------------------------------------------
# Session-scoped event loop
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# One-time table creation / teardown
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="session")
async def setup_database():
    """Create all tables once for the test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


# ---------------------------------------------------------------------------
# Per-test database session with automatic cleanup
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def db_session(setup_database):
    """
    Provide a database session for a single test.

    After the test, all rows inserted during the test are deleted so
    subsequent tests start with a clean database.  We use DELETE rather
    than ROLLBACK because the session is also used by the running app
    (which may issue its own commits).
    """
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    # Brute-force cleanup: delete all rows from every table in reverse
    # dependency order so FK constraints are satisfied.
    async with test_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


# ---------------------------------------------------------------------------
# FastAPI app with test overrides (NO lifespan)
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def app_instance(db_session):
    """
    Build a FastAPI application wired to the test database.

    We import the *routers* directly rather than using the `app` object from
    main.py so we avoid triggering the production lifespan (which starts the
    scheduler, LLM client, webhook client, and api_runner).
    """
    from fastapi import FastAPI
    from app.api.v1.router import v1_router

    test_app = FastAPI()
    test_app.include_router(v1_router)

    async def override_get_session():
        yield db_session

    test_app.dependency_overrides[get_session] = override_get_session
    yield test_app
    test_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Async HTTP client
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client(app_instance):
    """httpx.AsyncClient wired to the test FastAPI application."""
    transport = ASGITransport(app=app_instance)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Organization + user fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def test_org(db_session):
    """Create a test organization."""
    org = Organization(
        id=uuid.uuid4(),
        name="Test Org",
        slug="test-org",
        is_active=True,
    )
    db_session.add(org)
    await db_session.flush()
    return org


async def _create_user(
    db_session: AsyncSession,
    org: Organization,
    email: str,
    name: str,
    role: UserRole,
) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=AuthService.hash_password("TestPass123!"),
        display_name=name,
        role=role,
        organization_id=org.id,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def test_owner(db_session, test_org):
    return await _create_user(db_session, test_org, "owner@test.com", "Test Owner", UserRole.OWNER)


@pytest_asyncio.fixture
async def test_admin(db_session, test_org):
    return await _create_user(db_session, test_org, "admin@test.com", "Test Admin", UserRole.ADMIN)


@pytest_asyncio.fixture
async def test_member(db_session, test_org):
    return await _create_user(db_session, test_org, "member@test.com", "Test Member", UserRole.MEMBER)


@pytest_asyncio.fixture
async def test_viewer(db_session, test_org):
    return await _create_user(db_session, test_org, "viewer@test.com", "Test Viewer", UserRole.VIEWER)


# ---------------------------------------------------------------------------
# JWT token helpers
# ---------------------------------------------------------------------------
def _make_token(user: User) -> str:
    """Generate a JWT access token for a test user."""
    return AuthService.create_access_token(user)


@pytest_asyncio.fixture
async def owner_headers(test_owner):
    return {"Authorization": f"Bearer {_make_token(test_owner)}"}


@pytest_asyncio.fixture
async def admin_headers(test_admin):
    return {"Authorization": f"Bearer {_make_token(test_admin)}"}


@pytest_asyncio.fixture
async def member_headers(test_member):
    return {"Authorization": f"Bearer {_make_token(test_member)}"}


@pytest_asyncio.fixture
async def viewer_headers(test_viewer):
    return {"Authorization": f"Bearer {_make_token(test_viewer)}"}
