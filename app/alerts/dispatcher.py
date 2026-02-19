"""
Alert dispatcher — decides whether to fire an alert and sends it.

This is the single entry point for the scheduler to call after a
pipeline run completes.  It:
  1. Checks whether the risk level meets the configured threshold.
  2. Builds the alert payload.
  3. Sends it via the webhook client.

Design:
  - Stateless: call ``maybe_alert()`` with pipeline data.
  - Never raises: all errors are logged and swallowed.
  - Respects ``ALERT_MIN_RISK_LEVEL`` from config.
"""

from __future__ import annotations

import logging
from typing import Any

from app.alerts.payload import build_alert_payload
from app.alerts.webhook import webhook_client
from app.core.config import settings
from app.monitoring.runner_service import PipelineResult

logger = logging.getLogger(__name__)

# Risk levels ranked by severity (index = rank)
_RISK_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def _meets_threshold(risk_level: str) -> bool:
    """Return True if risk_level >= the configured minimum alert threshold."""
    actual = _RISK_RANK.get(risk_level, 0)
    threshold = _RISK_RANK.get(settings.ALERT_MIN_RISK_LEVEL, 1)
    return actual >= threshold


async def maybe_alert(
    *,
    pipeline: PipelineResult,
    endpoint_name: str,
    endpoint_url: str,
    endpoint_method: str,
) -> dict[str, Any]:
    """
    Check threshold and dispatch webhook if warranted.

    Returns a summary dict for logging.
    This method **never raises**.
    """
    risk = pipeline.risk
    risk_level = risk.risk_level if risk else "LOW"

    # Gate 1: webhook client available?
    if not webhook_client.available:
        return {"alerted": False, "reason": "webhook_unavailable"}

    # Gate 2: meets risk threshold?
    if not _meets_threshold(risk_level):
        logger.debug(
            "Alert skipped for %s: risk=%s < threshold=%s",
            endpoint_name,
            risk_level,
            settings.ALERT_MIN_RISK_LEVEL,
        )
        return {"alerted": False, "reason": "below_threshold", "risk_level": risk_level}

    # Build payload
    payload = build_alert_payload(
        pipeline=pipeline,
        endpoint_name=endpoint_name,
        endpoint_url=endpoint_url,
        endpoint_method=endpoint_method,
    )

    # Send
    logger.info(
        "Dispatching alert for %s: risk=%s(%.1f)",
        endpoint_name,
        risk_level,
        risk.calculated_score if risk else 0,
    )

    success = await webhook_client.send(payload)

    return {
        "alerted": True,
        "delivered": success,
        "risk_level": risk_level,
        "risk_score": risk.calculated_score if risk else 0,
    }
