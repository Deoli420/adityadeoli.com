"""
AI Debug Assistant — generates step-by-step remediation playbooks.

When an anomaly is detected, the existing AI provides reasoning.
This service adds a dedicated "Debug Assistant" that gathers full context
(recent runs, anomaly, SLA, alert rules) and generates structured
debugging suggestions via the LLM.

Cost gating: Only callable when latest anomaly severity >= 40.
Each call is tracked via AI Telemetry (Phase 7).
"""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm_client import llm_client
from app.ai.prompt_templates import _fmt_ms, _fmt_pct
from app.models.ai_telemetry import AiTelemetryRecord
from app.models.anomaly import Anomaly
from app.models.api_endpoint import ApiEndpoint
from app.models.api_run import ApiRun
from app.models.endpoint_sla import EndpointSLA
from app.models.risk_score import RiskScore
from app.repositories.ai_telemetry import AiTelemetryRepository

logger = logging.getLogger(__name__)

# ── Debug system prompt ──────────────────────────────────────────────────

DEBUG_SYSTEM_PROMPT = """You are SentinelAI's debugging assistant.

Your job is to analyse a problematic API endpoint using full historical context
and provide actionable, step-by-step debugging guidance.

You will receive:
- Endpoint metadata (URL, method, expected status)
- Recent run history (last 10 runs with status codes, response times, errors)
- Latest anomaly analysis (severity, reasoning, root cause)
- SLA configuration (if active)
- Performance statistics

RULES:
- Be concise, technical, and actionable.
- Provide specific debugging steps, not generic advice.
- Order steps from most likely to least likely root cause.
- Include concrete commands, queries, or checks when applicable.
- Consider patterns in the historical data.

Respond ONLY with a JSON object in this exact shape:
{
  "diagnosis": "string — 1-2 sentence summary of the problem",
  "steps": ["step 1 — specific action", "step 2 — specific action", ...],
  "likely_root_cause": "string — most probable cause based on evidence",
  "severity_assessment": "string — LOW|MEDIUM|HIGH|CRITICAL with brief justification",
  "related_patterns": ["pattern 1 — observed trend", "pattern 2 — correlation", ...]
}"""


def _build_debug_prompt(
    *,
    endpoint: ApiEndpoint,
    recent_runs: list[ApiRun],
    latest_anomaly: Anomaly | None,
    latest_risk: RiskScore | None,
    sla: EndpointSLA | None,
    failure_rate: float,
) -> str:
    """Build the user prompt with full debugging context."""
    lines = [
        "Analyse the following problematic API endpoint and provide debugging guidance:",
        "",
        f"Endpoint: {endpoint.name}",
        f"URL: {endpoint.method} {endpoint.url}",
        f"Expected Status: {endpoint.expected_status}",
        f"Historical Failure Rate: {failure_rate:.1f}%",
        "",
        "=== Recent Run History (last 10) ===",
    ]

    for i, run in enumerate(recent_runs[:10], 1):
        status = run.status_code or "N/A"
        time_ms = _fmt_ms(run.response_time_ms)
        success = "OK" if run.is_success else "FAIL"
        error = f" | Error: {run.error_message}" if run.error_message else ""
        lines.append(f"  Run {i}: {success} | HTTP {status} | {time_ms}{error}")

    if not recent_runs:
        lines.append("  No recent runs available")

    lines.append("")

    if latest_anomaly:
        lines.extend([
            "=== Latest Anomaly ===",
            f"  Detected: {latest_anomaly.anomaly_detected}",
            f"  Severity: {latest_anomaly.severity_score:.0f}/100",
            f"  Confidence: {latest_anomaly.confidence:.2f}",
            f"  Reasoning: {latest_anomaly.reasoning or 'N/A'}",
            f"  Probable Cause: {latest_anomaly.probable_cause or 'N/A'}",
            f"  Recommendation: {latest_anomaly.recommendation or 'N/A'}",
            f"  AI Called: {latest_anomaly.ai_called}",
            "",
        ])

    if latest_risk:
        lines.extend([
            "=== Latest Risk Score ===",
            f"  Score: {latest_risk.calculated_score:.1f}/100",
            f"  Level: {latest_risk.risk_level}",
            "",
        ])

    if sla:
        lines.extend([
            "=== SLA Configuration ===",
            f"  Target Uptime: {sla.sla_target_percent}%",
            f"  Max Response Time: {sla.max_response_time_ms}ms",
            f"  Window: {sla.uptime_window}",
            f"  Active: {sla.is_active}",
            "",
        ])

    # Run statistics
    if recent_runs:
        times = [r.response_time_ms for r in recent_runs if r.response_time_ms]
        successes = sum(1 for r in recent_runs if r.is_success)
        failures = len(recent_runs) - successes
        lines.extend([
            "=== Run Statistics ===",
            f"  Total runs shown: {len(recent_runs)}",
            f"  Successes: {successes}",
            f"  Failures: {failures}",
        ])
        if times:
            lines.extend([
                f"  Avg Response Time: {sum(times)/len(times):.1f}ms",
                f"  Min Response Time: {min(times):.1f}ms",
                f"  Max Response Time: {max(times):.1f}ms",
            ])
        lines.append("")

    lines.extend([
        "Tasks:",
        "1. Diagnose the root cause of the endpoint's issues.",
        "2. Provide 3-7 specific, ordered debugging steps.",
        "3. Identify the most likely root cause with evidence.",
        "4. Assess severity (LOW/MEDIUM/HIGH/CRITICAL) with brief justification.",
        "5. Note any patterns observed in the historical data.",
    ])

    return "\n".join(lines)


# ── Main service function ────────────────────────────────────────────────


async def generate_debug_suggestions(
    endpoint_id: uuid.UUID,
    tenant_id: uuid.UUID,
    session: AsyncSession,
) -> dict[str, Any] | None:
    """
    Generate AI-powered debugging suggestions for an endpoint.

    Returns structured debug suggestions dict or None if:
    - LLM is not available
    - No anomaly exists or severity too low
    - LLM call fails

    Cost gating: only runs when latest anomaly severity >= 40.
    """
    # 1. Load endpoint
    endpoint = await session.get(ApiEndpoint, endpoint_id)
    if not endpoint or endpoint.organization_id != tenant_id:
        return None

    # 2. Get recent runs (last 10)
    result = await session.execute(
        select(ApiRun)
        .where(
            ApiRun.endpoint_id == endpoint_id,
            ApiRun.organization_id == tenant_id,
        )
        .order_by(ApiRun.created_at.desc())
        .limit(10)
    )
    recent_runs = list(result.scalars().all())

    # 3. Get latest anomaly
    latest_anomaly = None
    if recent_runs:
        for run in recent_runs:
            anom_result = await session.execute(
                select(Anomaly).where(Anomaly.api_run_id == run.id)
            )
            anom = anom_result.scalar_one_or_none()
            if anom and anom.anomaly_detected:
                latest_anomaly = anom
                break

    # 4. Cost gate — only debug if there IS an anomaly with severity >= 40
    if latest_anomaly is None:
        logger.info("Debug skipped for %s — no anomaly detected", endpoint.name)
        return {
            "diagnosis": "No anomaly detected for this endpoint.",
            "steps": ["Endpoint appears healthy — no debugging needed."],
            "likely_root_cause": "N/A",
            "severity_assessment": "NONE — no anomaly",
            "related_patterns": [],
            "_skipped": True,
            "_reason": "No anomaly detected",
        }
    if latest_anomaly.severity_score < 40:
        logger.info(
            "Debug skipped for %s — severity %.0f < 40",
            endpoint.name,
            latest_anomaly.severity_score,
        )
        return {
            "diagnosis": "Anomaly severity is below threshold for AI debugging.",
            "steps": ["Continue monitoring — severity is low."],
            "likely_root_cause": "Minor fluctuations",
            "severity_assessment": "LOW — below debugging threshold",
            "related_patterns": [],
            "_skipped": True,
            "_reason": f"Severity {latest_anomaly.severity_score:.0f} < 40 threshold",
        }

    # 5. Get latest risk score
    latest_risk = None
    if recent_runs:
        risk_result = await session.execute(
            select(RiskScore).where(RiskScore.api_run_id == recent_runs[0].id)
        )
        latest_risk = risk_result.scalar_one_or_none()

    # 6. Get SLA config (if any)
    sla_result = await session.execute(
        select(EndpointSLA).where(
            EndpointSLA.endpoint_id == endpoint_id,
            EndpointSLA.is_active.is_(True),
        )
    )
    sla = sla_result.scalar_one_or_none()

    # 7. Compute failure rate
    from app.repositories.api_run import ApiRunRepository
    run_repo = ApiRunRepository(session)
    failure_rate = await run_repo.get_failure_rate(endpoint_id, tenant_id=tenant_id)

    # 8. Build prompt and call LLM
    if not llm_client.available:
        logger.warning("Debug assistant skipped — LLM not available")
        return None

    user_prompt = _build_debug_prompt(
        endpoint=endpoint,
        recent_runs=recent_runs,
        latest_anomaly=latest_anomaly,
        latest_risk=latest_risk,
        sla=sla,
        failure_rate=failure_rate,
    )

    raw = await llm_client.analyse(
        system_prompt=DEBUG_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    # 9. Persist AI telemetry
    if llm_client.last_call_telemetry:
        telem = llm_client.last_call_telemetry
        telemetry_repo = AiTelemetryRepository(session)
        await telemetry_repo.create(
            AiTelemetryRecord(
                endpoint_id=endpoint_id,
                organization_id=tenant_id,
                model_name=telem.model_name,
                prompt_tokens=telem.prompt_tokens,
                completion_tokens=telem.completion_tokens,
                total_tokens=telem.total_tokens,
                latency_ms=telem.latency_ms,
                success=telem.success,
                cost_usd=telem.cost_usd,
                error_message=telem.error_message,
            )
        )

    if raw is None:
        logger.error("Debug assistant LLM call failed for %s", endpoint.name)
        return None

    # 10. Validate and return
    return {
        "diagnosis": str(raw.get("diagnosis", "")),
        "steps": raw.get("steps", []),
        "likely_root_cause": str(raw.get("likely_root_cause", "")),
        "severity_assessment": str(raw.get("severity_assessment", "")),
        "related_patterns": raw.get("related_patterns", []),
    }
