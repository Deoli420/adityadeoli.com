from sqlalchemy import text
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)):
    try:
        await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unavailable"

    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status,
    }


@router.get("/health/detailed")
async def detailed_health_check(session: AsyncSession = Depends(get_session)):
    """Comprehensive health check reporting status of all subsystems.

    Returns degraded status when optional services are unavailable.
    Use for operational dashboards and alerting.
    """
    from app.ai.llm_client import llm_client
    from app.alerts.webhook import webhook_client
    from app.api.v1.ws import ws_manager
    from app.monitoring.api_runner import api_runner
    from app.scheduler.engine import monitor_scheduler

    subsystems = {}

    # Database
    try:
        await session.execute(text("SELECT 1"))
        subsystems["database"] = {"status": "ok"}
    except Exception as e:
        subsystems["database"] = {"status": "unavailable", "error": str(e)[:200]}

    # Scheduler
    if monitor_scheduler.is_running:
        sched_status = monitor_scheduler.get_status()
        subsystems["scheduler"] = {
            "status": "ok",
            "job_count": sched_status.get("job_count", 0),
            "started_at": sched_status.get("started_at"),
        }
    else:
        subsystems["scheduler"] = {
            "status": "disabled" if not settings.SCHEDULER_ENABLED else "unavailable",
        }

    # LLM Client
    subsystems["llm"] = {
        "status": "ok" if llm_client.available else "disabled",
        "model": settings.OPENAI_MODEL if llm_client.available else None,
        "metrics": llm_client.metrics.to_dict() if llm_client.available else None,
    }

    # Webhook Client
    subsystems["webhook"] = {
        "status": "ok" if webhook_client.available else "disabled",
    }

    # API Runner
    subsystems["api_runner"] = {
        "status": "ok" if api_runner._client is not None else "unavailable",
    }

    # WebSocket Manager
    total_ws = sum(len(conns) for conns in ws_manager._pools.values())
    subsystems["websocket"] = {
        "status": "ok",
        "active_connections": total_ws,
        "active_orgs": len(ws_manager._pools),
    }

    # Determine overall status
    critical = subsystems["database"]["status"]
    overall = "ok" if critical == "ok" else "degraded"

    # Check for any unavailable optional services
    for name, info in subsystems.items():
        if info["status"] == "unavailable":
            overall = "degraded"
            break

    return {
        "status": overall,
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "subsystems": subsystems,
    }
