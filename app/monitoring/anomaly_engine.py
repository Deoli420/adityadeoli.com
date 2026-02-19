"""
AI anomaly detection engine.

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

Design:
  - Pure orchestration — no database access.
  - Receives pre-computed data from the pipeline.
  - Returns an immutable AnomalyResult.
  - Falls back gracefully if LLM is unavailable.
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
    skipped_reason: Optional[str] = None
    ai_called: bool = False


# ─── sentinel values ────────────────────────────────────────────────────

NO_ANOMALY = AnomalyResult(skipped_reason="All signals healthy — AI skipped")


class AnomalyEngine:
    """
    Cost-gated AI anomaly analysis.

    Call ``analyse()`` with the full pipeline context.  The engine
    decides whether the LLM should be invoked based on signal severity.
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

        This method **never raises**.
        """
        # ── gate: should we call the LLM? ────────────────────────────
        needs_ai = self._should_call_ai(
            is_success=is_success,
            error_message=error_message,
            performance=performance,
            drift=drift,
        )

        if not needs_ai:
            logger.debug("All signals healthy — AI call skipped for %s", endpoint_name)
            return NO_ANOMALY

        # ── LLM available? ───────────────────────────────────────────
        if not self._llm.available:
            logger.warning("AI needed but LLM client unavailable for %s", endpoint_name)
            return AnomalyResult(
                skipped_reason="LLM client unavailable — configure OPENAI_API_KEY",
            )

        # ── build prompt ─────────────────────────────────────────────
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

        # ── call LLM ─────────────────────────────────────────────────
        raw = await self._llm.analyse(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        if raw is None:
            logger.error("LLM returned no result for %s", endpoint_name)
            return AnomalyResult(
                skipped_reason="LLM call failed — see logs",
                ai_called=True,
            )

        # ── parse LLM response ───────────────────────────────────────
        return self._parse_response(raw)

    # ── internals ────────────────────────────────────────────────────

    @staticmethod
    def _should_call_ai(
        *,
        is_success: bool,
        error_message: str | None,
        performance: PerformanceResult | None,
        drift: DriftAnalysis | None,
    ) -> bool:
        """Return True if any signal warrants AI analysis."""
        if not is_success:
            return True
        if error_message:
            return True
        if performance and performance.is_spike:
            return True
        if drift and drift.has_drift:
            return True
        return False

    @staticmethod
    def _parse_response(raw: dict[str, Any]) -> AnomalyResult:
        """
        Parse the LLM JSON response into an ``AnomalyResult``.

        Tolerant of missing/malformed fields — uses safe defaults.
        """
        return AnomalyResult(
            anomaly_detected=bool(raw.get("anomaly_detected", False)),
            severity_score=float(raw.get("severity_score", 0)),
            reasoning=str(raw.get("reasoning", "")),
            probable_cause=str(raw.get("probable_cause", "")),
            ai_called=True,
        )
