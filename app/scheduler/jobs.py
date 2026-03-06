"""
Scheduled monitoring jobs.

Each function in this module is a self-contained job that APScheduler
calls on a timer.  Jobs are responsible for:
  - Opening their own database session (no FastAPI request context).
  - Running the full monitoring pipeline via ``RunnerService``.
  - Dispatching alerts when risk thresholds are met.
  - Handling all errors gracefully (a failing job must never crash
    the scheduler).

Design:
  - Jobs use ``async_session_factory`` directly — there is no
    FastAPI ``Depends`` injection in background tasks.
  - Reuses the module-level singletons (``api_runner``, ``llm_client``).
  - Alerts fire AFTER the DB commit, so data is safe even if webhook fails.
  - Each job execution is fully independent and self-cleaning.
"""

from __future__ import annotations

import logging
import uuid

from app.ai.llm_client import llm_client
from app.alerts.dispatcher import maybe_alert, maybe_alert_sla_breach
from app.db.session import async_session_factory
from app.monitoring.anomaly_engine import AnomalyEngine
from app.monitoring.api_runner import api_runner
from app.monitoring.runner_service import RunnerService

logger = logging.getLogger(__name__)


async def run_endpoint(endpoint_id: str) -> None:
    """
    Execute the full monitoring pipeline for a single endpoint.

    This is the function that APScheduler calls on each interval tick.
    It opens its own DB session, runs the pipeline, commits, then
    fires alerts if the risk threshold is met.

    Parameters:
        endpoint_id: UUID string of the endpoint to monitor.

    This function **never raises** — all errors are logged and swallowed
    so that the scheduler continues running other jobs.
    """
    try:
        eid = uuid.UUID(endpoint_id)
    except ValueError:
        logger.error("Invalid endpoint_id passed to job: %s", endpoint_id)
        return

    logger.debug("Scheduler job started for endpoint %s", eid)

    try:
        async with async_session_factory() as session:
            service = RunnerService(
                session=session,
                runner=api_runner,
                anomaly_engine=AnomalyEngine(llm=llm_client),
            )

            pipeline = await service.execute_endpoint(eid)
            await session.commit()

            logger.info(
                "Scheduler job completed for endpoint %s: "
                "success=%s risk=%s(%s)",
                eid,
                pipeline.run.is_success,
                pipeline.risk.calculated_score if pipeline.risk else "N/A",
                pipeline.risk.risk_level if pipeline.risk else "N/A",
            )

        # Alert dispatch — AFTER commit so DB data is safe
        try:
            alert_result = await maybe_alert(
                pipeline=pipeline,
                endpoint_name=pipeline.endpoint_name,
                endpoint_url=pipeline.endpoint_url,
                endpoint_method=pipeline.endpoint_method,
            )
            if alert_result.get("alerted"):
                logger.info(
                    "Alert dispatched for %s: delivered=%s",
                    pipeline.endpoint_name,
                    alert_result.get("delivered"),
                )
        except Exception:
            logger.exception("Alert dispatch failed for endpoint %s", eid)

        # SLA breach check — AFTER alert dispatch
        try:
            await _check_sla_breach(eid, pipeline)
        except Exception:
            logger.exception("SLA breach check failed for endpoint %s", eid)

        # Custom alert rule evaluation — AFTER SLA check
        try:
            await _evaluate_alert_rules(eid, pipeline)
        except Exception:
            logger.exception("Alert rule evaluation failed for endpoint %s", eid)

        # Incident auto-create / auto-resolve — AFTER alert rules
        try:
            await _manage_incidents(eid, pipeline)
        except Exception:
            logger.exception("Incident management failed for endpoint %s", eid)

        # WebSocket broadcast — AFTER all processing
        try:
            await _broadcast_pipeline_events(eid, pipeline)
        except Exception:
            logger.exception("WS broadcast failed for endpoint %s", eid)

    except Exception:
        logger.exception("Scheduler job FAILED for endpoint %s", eid)


async def _check_sla_breach(eid: uuid.UUID, pipeline) -> None:  # noqa: ANN001
    """Check if the endpoint is breaching its SLA and fire an alert if so."""
    from app.repositories.api_run import ApiRunRepository
    from app.repositories.endpoint_sla import EndpointSLARepository
    from app.services.endpoint_sla import EndpointSLAService

    async with async_session_factory() as session:
        sla_service = EndpointSLAService(
            repo=EndpointSLARepository(session),
            run_repo=ApiRunRepository(session),
        )
        sla_repo = EndpointSLARepository(session)
        sla = await sla_repo.get_by_endpoint(eid)
        if sla is None or not sla.is_active:
            return

        uptime = await sla_service.get_uptime(eid, sla.organization_id)
        if not uptime.is_breached:
            return

        result = await maybe_alert_sla_breach(
            endpoint_id=str(eid),
            endpoint_name=pipeline.endpoint_name,
            endpoint_url=pipeline.endpoint_url,
            endpoint_method=pipeline.endpoint_method,
            uptime_percent=uptime.uptime_percent,
            sla_target=uptime.sla_target,
            window=uptime.window,
            total_runs=uptime.total_runs,
            successful_runs=uptime.successful_runs,
        )
        if result.get("alerted"):
            logger.info(
                "SLA breach alert dispatched for %s: uptime=%.2f%%",
                pipeline.endpoint_name,
                uptime.uptime_percent,
            )


async def _evaluate_alert_rules(eid: uuid.UUID, pipeline) -> None:  # noqa: ANN001
    """Evaluate all custom alert rules for the endpoint."""
    from app.alerts.rule_evaluator import RuleEvaluator

    async with async_session_factory() as session:
        evaluator = RuleEvaluator(session)
        results = await evaluator.evaluate(
            endpoint_id=eid,
            pipeline=pipeline,
            tenant_id=pipeline.run.organization_id,
        )
        await session.commit()

        triggered = [r for r in results if r.get("triggered")]
        if triggered:
            logger.info(
                "Alert rules triggered for %s: %s",
                pipeline.endpoint_name,
                [r["name"] for r in triggered],
            )


async def _manage_incidents(eid: uuid.UUID, pipeline) -> None:  # noqa: ANN001
    """Auto-create incidents from anomalies and auto-resolve on recovery."""
    from app.repositories.incident import IncidentRepository
    from app.services.incident import IncidentService

    async with async_session_factory() as session:
        svc = IncidentService(IncidentRepository(session))

        # Auto-create from anomaly
        if pipeline.anomaly and pipeline.anomaly.is_anomaly:
            incident = await svc.auto_create_from_anomaly(
                endpoint_id=eid,
                organization_id=pipeline.run.organization_id,
                run_id=pipeline.run.id,
                reasoning=pipeline.anomaly.reasoning,
                severity_score=(
                    pipeline.risk.calculated_score if pipeline.risk else 0.5
                ),
            )
            if incident:
                logger.info(
                    "Auto-created incident %s for %s (severity=%s)",
                    incident.id,
                    pipeline.endpoint_name,
                    incident.severity,
                )

        # Auto-resolve on consecutive successes
        if pipeline.run.is_success:
            consecutive = await _count_consecutive_successes(session, eid)
            resolved = await svc.check_auto_resolve(eid, consecutive)
            if resolved:
                logger.info(
                    "Auto-resolved incident %s for %s after %d successes",
                    resolved.id,
                    pipeline.endpoint_name,
                    consecutive,
                )

        await session.commit()


async def _broadcast_pipeline_events(eid: uuid.UUID, pipeline) -> None:  # noqa: ANN001
    """Broadcast real-time events to connected WebSocket clients."""
    from app.api.v1.ws import ws_manager

    org_id = pipeline.run.organization_id

    # Always broadcast new_run
    await ws_manager.broadcast(org_id, {
        "type": "new_run",
        "endpoint_id": str(eid),
        "endpoint_name": pipeline.endpoint_name,
        "run_id": str(pipeline.run.id),
        "status_code": pipeline.run.status_code,
        "response_time_ms": pipeline.run.response_time_ms,
        "is_success": pipeline.run.is_success,
    })

    # Broadcast risk update if available
    if pipeline.risk:
        await ws_manager.broadcast(org_id, {
            "type": "risk_update",
            "endpoint_id": str(eid),
            "endpoint_name": pipeline.endpoint_name,
            "score": pipeline.risk.calculated_score,
            "level": pipeline.risk.risk_level,
        })

    # Broadcast anomaly if detected
    if pipeline.anomaly and pipeline.anomaly.is_anomaly:
        await ws_manager.broadcast(org_id, {
            "type": "anomaly_detected",
            "endpoint_id": str(eid),
            "endpoint_name": pipeline.endpoint_name,
            "reasoning": (pipeline.anomaly.reasoning or "")[:200],
        })


async def _count_consecutive_successes(session, eid: uuid.UUID) -> int:  # noqa: ANN001
    """Count consecutive successful runs from the most recent backwards."""
    from sqlalchemy import select
    from app.models.api_run import ApiRun

    result = await session.execute(
        select(ApiRun.is_success)
        .where(ApiRun.endpoint_id == eid)
        .order_by(ApiRun.created_at.desc())
        .limit(20)
    )
    count = 0
    for (success,) in result:
        if success:
            count += 1
        else:
            break
    return count
