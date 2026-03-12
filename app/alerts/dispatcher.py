"""
Alert dispatcher — decides whether to fire an alert and sends it.

This is the single entry point for the scheduler to call after a
pipeline run completes.  It:
  1. Checks whether the risk level meets the configured threshold.
  2. Enforces a cooldown window to prevent alert fatigue.
  3. Builds the alert payload.
  4. Sends it via the webhook client.

Design:
  - Stateless: call ``maybe_alert()`` with pipeline data.
  - Never raises: all errors are logged and swallowed.
  - Respects ``ALERT_MIN_RISK_LEVEL`` from config.
  - Cooldown: at most one alert per endpoint per ALERT_COOLDOWN_SECONDS.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from app.alerts.payload import build_alert_payload, build_sla_breach_payload
from app.alerts.webhook import webhook_client
from app.core.config import settings
from app.monitoring.runner_service import PipelineResult

logger = logging.getLogger(__name__)

# Risk levels ranked by severity (index = rank)
_RISK_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}

# Cooldown tracker: endpoint_id → last alert timestamp (monotonic)
_cooldown_tracker: dict[str, float] = {}

# Default cooldown: 15 minutes (configurable via settings)
_COOLDOWN_SECONDS = getattr(settings, "ALERT_COOLDOWN_SECONDS", 900)


def _meets_threshold(risk_level: str) -> bool:
    """Return True if risk_level >= the configured minimum alert threshold."""
    actual = _RISK_RANK.get(risk_level, 0)
    threshold = _RISK_RANK.get(settings.ALERT_MIN_RISK_LEVEL, 1)
    return actual >= threshold


def _in_cooldown(endpoint_id: str) -> bool:
    """Return True if this endpoint was alerted recently (within cooldown)."""
    last_alert = _cooldown_tracker.get(endpoint_id)
    if last_alert is None:
        return False
    elapsed = time.monotonic() - last_alert
    return elapsed < _COOLDOWN_SECONDS


def _mark_alerted(endpoint_id: str) -> None:
    """Record that an alert was sent for this endpoint."""
    _cooldown_tracker[endpoint_id] = time.monotonic()


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
    endpoint_id = str(pipeline.run.endpoint_id)

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

    # Gate 3: cooldown window — prevent alert fatigue
    if _in_cooldown(endpoint_id):
        logger.debug(
            "Alert suppressed for %s: within %ds cooldown window",
            endpoint_name,
            _COOLDOWN_SECONDS,
        )
        return {
            "alerted": False,
            "reason": "cooldown",
            "risk_level": risk_level,
            "cooldown_seconds": _COOLDOWN_SECONDS,
        }

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

    # Mark cooldown regardless of delivery success — prevent retry storms
    _mark_alerted(endpoint_id)

    return {
        "alerted": True,
        "delivered": success,
        "risk_level": risk_level,
        "risk_score": risk.calculated_score if risk else 0,
    }


async def maybe_alert_sla_breach(
    *,
    endpoint_id: str,
    endpoint_name: str,
    endpoint_url: str,
    endpoint_method: str,
    uptime_percent: float,
    sla_target: float,
    window: str,
    total_runs: int,
    successful_runs: int,
) -> dict[str, Any]:
    """
    Send a webhook alert for an SLA breach.

    This method **never raises**.
    """
    try:
        if not webhook_client.available:
            return {"alerted": False, "reason": "webhook_unavailable"}

        # SLA alerts also respect cooldown
        cooldown_key = f"sla_{endpoint_id}"
        if _in_cooldown(cooldown_key):
            logger.debug(
                "SLA breach alert suppressed for %s: within cooldown",
                endpoint_name,
            )
            return {"alerted": False, "reason": "cooldown"}

        payload = build_sla_breach_payload(
            endpoint_id=endpoint_id,
            endpoint_name=endpoint_name,
            endpoint_url=endpoint_url,
            endpoint_method=endpoint_method,
            uptime_percent=uptime_percent,
            sla_target=sla_target,
            window=window,
            total_runs=total_runs,
            successful_runs=successful_runs,
        )

        logger.info(
            "Dispatching SLA breach alert for %s: uptime=%.2f%% < target=%.2f%%",
            endpoint_name,
            uptime_percent,
            sla_target,
        )

        success = await webhook_client.send(payload)
        _mark_alerted(cooldown_key)
        return {"alerted": True, "delivered": success, "event": "sla_breach"}

    except Exception:
        logger.exception("SLA breach alert dispatch failed for %s", endpoint_name)
        return {"alerted": False, "reason": "exception"}
