"""
Alert payload builder.

Constructs a structured JSON payload from the monitoring pipeline result.
This payload is what gets sent to n8n (or any webhook receiver).

The payload is designed to be:
  - Self-contained: all context needed to understand the alert.
  - n8n-friendly: flat-ish structure, no deeply nested objects.
  - Actionable: includes the endpoint URL, risk score, and reasoning.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.monitoring.runner_service import PipelineResult


def build_alert_payload(
    *,
    pipeline: PipelineResult,
    endpoint_name: str,
    endpoint_url: str,
    endpoint_method: str,
) -> dict[str, Any]:
    """
    Build the webhook JSON payload from a completed pipeline result.

    Returns a dict ready for ``json.dumps()`` / ``httpx.post(json=...)``.
    """
    run = pipeline.run
    risk = pipeline.risk
    anomaly = pipeline.anomaly
    perf = pipeline.performance

    payload: dict[str, Any] = {
        # ── metadata ────────────────────────────────────────────────
        "event": "sentinel_alert",
        "timestamp": datetime.now(timezone.utc).isoformat(),

        # ── endpoint ────────────────────────────────────────────────
        "endpoint": {
            "id": str(run.endpoint_id),
            "name": endpoint_name,
            "url": endpoint_url,
            "method": endpoint_method,
        },

        # ── run ─────────────────────────────────────────────────────
        "run": {
            "id": str(run.id),
            "status_code": run.status_code,
            "response_time_ms": run.response_time_ms,
            "is_success": run.is_success,
            "error_message": run.error_message,
        },

        # ── risk ────────────────────────────────────────────────────
        "risk": {
            "score": risk.calculated_score if risk else 0.0,
            "level": risk.risk_level if risk else "LOW",
            "breakdown": {
                "status": risk.status_score if risk else 0.0,
                "performance": risk.performance_score if risk else 0.0,
                "drift": risk.drift_score if risk else 0.0,
                "ai": risk.ai_score if risk else 0.0,
                "history": risk.history_score if risk else 0.0,
            },
        },
    }

    # ── anomaly (only if AI was called and detected something) ──────
    if anomaly and anomaly.ai_called and anomaly.anomaly_detected:
        payload["anomaly"] = {
            "severity_score": anomaly.severity_score,
            "reasoning": anomaly.reasoning,
            "probable_cause": anomaly.probable_cause,
        }

    # ── performance (only if a spike was detected) ──────────────────
    if perf and perf.is_spike:
        payload["performance"] = {
            "current_ms": perf.current_time_ms,
            "avg_ms": perf.rolling_avg_ms,
            "deviation_percent": perf.deviation_percent,
            "is_critical_spike": perf.is_critical_spike,
        }

    # ── schema drift (only if drift detected) ───────────────────────
    drift = pipeline.schema_drift
    if drift and drift.has_drift:
        payload["schema_drift"] = {
            "total_differences": drift.drift_count,
        }

    return payload
