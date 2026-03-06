from fastapi import APIRouter

from app.api.v1.ai_telemetry import router as ai_telemetry_router
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
from app.api.v1.sla import router as sla_router
from app.api.v1.alert_rules import router as alert_rules_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.export import router as export_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.schema import router as schema_router
from app.api.v1.debug import router as debug_router
from app.api.v1.security import router as security_router
from app.api.v1.ci import router as ci_router
from app.api.v1.contracts import router as contracts_router

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
v1_router.include_router(sla_router)
v1_router.include_router(alert_rules_router)
v1_router.include_router(incidents_router)
v1_router.include_router(export_router)
v1_router.include_router(onboarding_router)
v1_router.include_router(ai_telemetry_router)
v1_router.include_router(schema_router)
v1_router.include_router(debug_router)
v1_router.include_router(security_router)
v1_router.include_router(ci_router)
v1_router.include_router(contracts_router)
