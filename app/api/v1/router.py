from fastapi import APIRouter

from app.api.v1.alerts import router as alerts_router
from app.api.v1.anomalies import router as anomalies_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.auth import router as auth_router
from app.api.v1.endpoints import router as endpoints_router
from app.api.v1.health import router as health_router
from app.api.v1.monitor import router as monitor_router
from app.api.v1.proxy import router as proxy_router
from app.api.v1.risk_scores import router as risk_scores_router
from app.api.v1.runs import router as runs_router
from app.api.v1.scheduler import router as scheduler_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(health_router)
v1_router.include_router(auth_router)
v1_router.include_router(endpoints_router)
v1_router.include_router(runs_router)
v1_router.include_router(anomalies_router)
v1_router.include_router(risk_scores_router)
v1_router.include_router(monitor_router)
v1_router.include_router(scheduler_router)
v1_router.include_router(alerts_router)
v1_router.include_router(proxy_router)
v1_router.include_router(dashboard_router)
