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
from app.alerts.dispatcher import maybe_alert
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

    except Exception:
        logger.exception("Scheduler job FAILED for endpoint %s", eid)
