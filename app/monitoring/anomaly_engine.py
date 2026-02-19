"""
AI anomaly detection engine with rule-based fallback.

Sits in the monitoring pipeline after performance tracking and schema
drift detection.  Decides whether to call the LLM and, if so, builds
the prompt, sends it, and returns a structured anomaly result.

COST OPTIMISATION:
  This engine does NOT call the LLM when everything is healthy.
  AI is invoked only when at least one signal indicates a problem:
    - Status mismatch (actual ≠ expected)
    - Performance spike detected
    - Schema drift detected
    - HTTP error (timeout, connection failure)

  This is critical for a SaaS product — LLM calls cost money.
  "Don't pay for good news."

RESILIENCE:
  If the LLM fails after retries, the engine falls back to a
  deterministic rule-based analysis.  The user ALWAYS gets a result.

Design:
  - Pure orchestration — no database access.
  - Receives pre-computed data from the pipeline.
  - Returns an immutable AnomalyResult.
  - Falls back to rules if LLM is unavailable or fails.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

from app.ai.llm_client import LLMClient
from app.ai.prompt_templates import SYSTEM_PROMPT, build_user_prompt
from app.monitoring.performance_tracker import PerformanceResult
from app.monitoring.schema_validator import DriftAnalysis

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class AnomalyResult:
    """Immutable output from the anomaly engine."""

    anomaly_detected: bool = False
    severity_score: float = 0.0
    reasoning: str = ""
    probable_cause: str = ""
    confidence: float = 0.0
    recommendation: str = ""
    skipped_reason: Optional[str] = None
    ai_called: bool = False
    used_fallback: bool = False


# ─── sentinel values ────────────────────────────────────────────────────

NO_ANOMALY = AnomalyResult(
    skipped_reason="All signals healthy — AI skipped",
    confidence=1.0,
)


class AnomalyEngine:
    """
    Cost-gated AI anomaly analysis with rule-based fallback.

    Call ``analyse()`` with the full pipeline context.  The engine
    decides whether the LLM should be invoked based on signal severity.
    If the LLM fails, falls back to deterministic rule-based analysis.
    """

    def __init__(self, llm: LLMClient) -> None:
        self._llm = llm

    async def analyse(
        self,
        *,
        # Endpoint metadata
        endpoint_name: str,
        url: str,
        method: str,
        expected_status: int,
        # Run data
        actual_status: int | None,
        response_time_ms: float | None,
        is_success: bool,
        error_message: str | None,
        # Performance
        performance: PerformanceResult | None,
        # Schema drift
        drift: DriftAnalysis | None,
        # Historical
        failure_rate_percent: float,
    ) -> AnomalyResult:
        """
        Analyse a single run and return an ``AnomalyResult``.

        This method **never raises**.  On LLM failure, falls back to
        rule-based analysis.
        """
        # ── gate: should we call the AI? ────────────────────────────
        signals = self._collect_signals(
            is_success=is_success,
            error_message=error_message,
            performance=performance,
            drift=drift,
        )

        if not signals:
            logger.debug("All signals healthy — AI call skipped for %s", endpoint_name)
            return NO_ANOMALY

        logger.info(
            "Anomaly signals for %s: %s",
            endpoint_name,
            ", ".join(signals),
        )

        # ── try LLM analysis ───────────────────────────────────────
        if self._llm.available:
            schema_diff_summary: dict[str, Any] | None = None
            if drift and drift.diff:
                schema_diff_summary = drift.diff.to_summary_dict()

            user_prompt = build_user_prompt(
                endpoint_name=endpoint_name,
                url=url,
                method=method,
                expected_status=expected_status,
                actual_status=actual_status,
                response_time_ms=response_time_ms,
                avg_response_time_ms=(
                    performance.rolling_avg_ms if performance else None
                ),
                deviation_percent=(
                    performance.deviation_percent if performance else None
                ),
                schema_diff_summary=schema_diff_summary,
                failure_rate_percent=failure_rate_percent,
                error_message=error_message,
            )

            logger.info("Calling AI for anomaly analysis on %s", endpoint_name)

            raw = await self._llm.analyse(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )

            if raw is not None:
                result = self._parse_response(raw)
                logger.info(
                    "AI analysis for %s: detected=%s severity=%.0f confidence=%.2f",
                    endpoint_name,
                    result.anomaly_detected,
                    result.severity_score,
                    result.confidence,
                )
                return result

            logger.warning(
                "LLM failed for %s — falling back to rule-based analysis",
                endpoint_name,
            )
        else:
            logger.warning(
                "LLM unavailable for %s — using rule-based analysis",
                endpoint_name,
            )

        # ── fallback: rule-based analysis ───────────────────────────
        return self._rule_based_analysis(
            endpoint_name=endpoint_name,
            is_success=is_success,
            error_message=error_message,
            actual_status=actual_status,
            expected_status=expected_status,
            performance=performance,
            drift=drift,
            failure_rate_percent=failure_rate_percent,
            signals=signals,
        )

    # ── signal collection ─────────────────────────────────────────

    @staticmethod
    def _collect_signals(
        *,
        is_success: bool,
        error_message: str | None,
        performance: PerformanceResult | None,
        drift: DriftAnalysis | None,
    ) -> list[str]:
        """Return list of triggered signal names.  Empty = all healthy."""
        signals: list[str] = []
        if not is_success:
            signals.append("status_failure")
        if error_message:
            signals.append("http_error")
        if performance and performance.is_spike:
            signals.append("latency_spike")
        if performance and performance.is_critical_spike:
            signals.append("critical_latency_spike")
        if drift and drift.has_drift:
            signals.append("schema_drift")
        return signals

    # ── LLM response parsing ──────────────────────────────────────

    @staticmethod
    def _parse_response(raw: dict[str, Any]) -> AnomalyResult:
        """
        Parse the LLM JSON response into an ``AnomalyResult``.

        Tolerant of missing/malformed fields — uses safe defaults.
        Validates and clamps all numeric fields.
        """
        # Clamp severity to [0, 100] — defensive against non-numeric LLM output
        try:
            severity = float(raw.get("severity_score", 0))
        except (ValueError, TypeError):
            severity = 50.0  # conservative default on malformed data
        severity = max(0.0, min(100.0, severity))

        # Clamp confidence to [0.0, 1.0]
        try:
            confidence = float(raw.get("confidence", 0.5))
        except (ValueError, TypeError):
            confidence = 0.5
        confidence = max(0.0, min(1.0, confidence))

        return AnomalyResult(
            anomaly_detected=bool(raw.get("anomaly_detected", False)),
            severity_score=severity,
            reasoning=str(raw.get("reasoning", "")),
            probable_cause=str(raw.get("probable_cause", "")),
            confidence=confidence,
            recommendation=str(raw.get("recommendation", "")),
            ai_called=True,
        )

    # ── rule-based fallback ───────────────────────────────────────

    @staticmethod
    def _rule_based_analysis(
        *,
        endpoint_name: str,
        is_success: bool,
        error_message: str | None,
        actual_status: int | None,
        expected_status: int,
        performance: PerformanceResult | None,
        drift: DriftAnalysis | None,
        failure_rate_percent: float,
        signals: list[str],
    ) -> AnomalyResult:
        """
        Deterministic fallback when LLM is unavailable.

        Uses simple rules to score severity from pipeline signals.
        Always returns a result — the user never sees "analysis failed".
        """
        severity = 0.0
        reasons: list[str] = []
        causes: list[str] = []
        recommendations: list[str] = []

        # ── Status failure ─────────────────────────────────────────
        if not is_success:
            if actual_status is None:
                severity += 60
                reasons.append("Request failed with no response")
                causes.append("Connection timeout or DNS failure")
                recommendations.append("Check endpoint availability and network connectivity")
            elif actual_status >= 500:
                severity += 50
                reasons.append(f"Server error: HTTP {actual_status}")
                causes.append("Upstream server issue")
                recommendations.append("Check server logs and health status")
            elif actual_status >= 400:
                severity += 25
                reasons.append(f"Client error: HTTP {actual_status} (expected {expected_status})")
                causes.append("Request configuration or authentication issue")
                recommendations.append("Verify endpoint configuration and credentials")

        # ── Error message ──────────────────────────────────────────
        if error_message:
            if "timeout" in error_message.lower():
                severity += 20
                reasons.append("Request timed out")
                causes.append("Slow response or network latency")
            elif "connection" in error_message.lower():
                severity += 30
                reasons.append("Connection error")
                causes.append("Service unreachable or DNS failure")

        # ── Performance spike ──────────────────────────────────────
        if performance:
            if performance.is_critical_spike:
                severity += 35
                deviation = performance.deviation_percent or 0
                reasons.append(f"Critical latency spike: {deviation:+.0f}% deviation")
                causes.append("Resource exhaustion or downstream bottleneck")
                recommendations.append("Profile the endpoint and check system resources")
            elif performance.is_spike:
                severity += 20
                deviation = performance.deviation_percent or 0
                reasons.append(f"Latency spike detected: {deviation:+.0f}% above average")
                causes.append("Temporary load increase or network jitter")

        # ── Schema drift ───────────────────────────────────────────
        if drift and drift.has_drift:
            diff_count = drift.drift_count
            if diff_count >= 5:
                severity += 25
                reasons.append(f"Significant schema drift: {diff_count} differences")
                causes.append("API contract changed")
                recommendations.append("Review API changelog and update expected schema")
            else:
                severity += 10
                reasons.append(f"Minor schema drift: {diff_count} difference(s)")
                causes.append("Response structure variation")

        # ── Historical failure rate ────────────────────────────────
        if failure_rate_percent >= 30:
            severity += 15
            reasons.append(f"High historical failure rate: {failure_rate_percent:.0f}%")
            recommendations.append("Investigate recurring failures")

        # Clamp and determine detection
        severity = max(0.0, min(100.0, severity))
        detected = severity >= 20

        reasoning = ". ".join(reasons) if reasons else "No anomalies detected"
        cause = "; ".join(causes) if causes else "No issues identified"
        recommendation = ". ".join(recommendations) if recommendations else "Continue monitoring"

        # Confidence is lower for rule-based (no AI nuance)
        confidence = 0.6 if detected else 0.8

        logger.info(
            "Rule-based analysis for %s: detected=%s severity=%.0f signals=%s",
            endpoint_name,
            detected,
            severity,
            signals,
        )

        return AnomalyResult(
            anomaly_detected=detected,
            severity_score=severity,
            reasoning=reasoning,
            probable_cause=cause,
            confidence=confidence,
            recommendation=recommendation,
            ai_called=False,
            used_fallback=True,
        )
