import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.ai.llm_client import llm_client
from app.alerts.webhook import webhook_client
from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.base import Base
from app.db.session import engine
from app.monitoring.api_runner import api_runner
from app.scheduler.engine import monitor_scheduler

# Ensure all models are imported so Base.metadata is populated.
import app.models.api_endpoint  # noqa: F401
import app.models.api_run  # noqa: F401
import app.models.anomaly  # noqa: F401
import app.models.risk_score  # noqa: F401
import app.models.organization  # noqa: F401
import app.models.user  # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.audit_log  # noqa: F401

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await api_runner.startup()
    llm_client.startup()
    webhook_client.startup()
    monitor_scheduler.startup()
    await monitor_scheduler.sync_jobs()

    yield

    # Shutdown
    await monitor_scheduler.shutdown()
    await webhook_client.shutdown()
    await llm_client.shutdown()
    await api_runner.shutdown()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow the frontend origin to send credentials (cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)
