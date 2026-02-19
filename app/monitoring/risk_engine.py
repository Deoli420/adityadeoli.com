"""
Deterministic risk scoring engine.

Produces a composite risk score (0–100) from all pipeline signals,
with a human-readable risk level (LOW / MEDIUM / HIGH / CRITICAL).

This is the LAST analysis step in the pipeline — it aggregates
everything that came before it into a single actionable number.

Scoring model (weighted composite):
  ┌────────────────────────┬────────┬─────────────────────────────────────┐
  │ Signal                 │ Weight │ Notes                               │
  ├────────────────────────┼────────┼─────────────────────────────────────┤
  │ Status failure         │ 35     │ Binary: 0 or 35                     │
  │ Performance deviation  │ 25     │ Scaled: deviation % mapped to 0–25  │
  │ Schema drift           │ 20     │ Scaled: diff count mapped to 0–20   │
  │ AI severity            │ 15     │ Direct: severity_score * 0.15       │
  │ Historical failure %   │  5     │ Scaled: failure rate mapped to 0–5  │
  └────────────────────────┴────────┴─────────────────────────────────────┘

Risk levels:
  0–24   → LOW        (healthy, normal variance)
  25–49  → MEDIUM     (degraded, investigate)
  50–74  → HIGH       (failing, action required)
  75–100 → CRITICAL   (catastrophic, immediate response)

Design:
  - Pure computation — no I/O, no database, no LLM calls.
  - Stateless: call ``score()`` with pre-computed data.
  - Returns an immutable ``RiskResult``.
  - Deterministic: same inputs always produce the same score.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from app.monitoring.anomaly_engine import AnomalyResult
from app.monitoring.performance_tracker import PerformanceResult
from app.monitoring.schema_validator import DriftAnalysis

logger = logging.getLogger(__name__)


# ─── risk levels ───────────────────────────────────────────────────────

RISK_LOW = "LOW"
RISK_MEDIUM = "MEDIUM"
RISK_HIGH = "HIGH"
RISK_CRITICAL = "CRITICAL"


@dataclass(frozen=True, slots=True)
class RiskResult:
    """Immutable output from the risk engine."""

    calculated_score: float = 0.0
    risk_level: str = RISK_LOW

    # Individual component scores for transparency
    status_score: float = 0.0
    performance_score: float = 0.0
    drift_score: float = 0.0
    ai_score: float = 0.0
    history_score: float = 0.0


def _classify(score: float) -> str:
    """Map a 0–100 score to a risk level string."""
    if score >= 75:
        return RISK_CRITICAL
    if score >= 50:
        return RISK_HIGH
    if score >= 25:
        return RISK_MEDIUM
    return RISK_LOW


def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp value between lo and hi."""
    return max(lo, min(hi, value))


class RiskEngine:
    """
    Stateless, deterministic risk scorer.

    Takes all upstream pipeline outputs and returns a composite risk
    score with a human-readable risk level.
    """

    # ── weights (must sum to 100) ───────────────────────────────────
    W_STATUS = 35.0
    W_PERFORMANCE = 25.0
    W_DRIFT = 20.0
    W_AI = 15.0
    W_HISTORY = 5.0

    # ── scaling thresholds ──────────────────────────────────────────
    # Performance: deviation >= this → max score for that component
    PERF_MAX_DEVIATION = 300.0  # percent

    # Drift: this many diffs → max score for that component
    DRIFT_MAX_DIFFS = 10

    # History: failure rate >= this → max score for that component
    HISTORY_MAX_RATE = 50.0  # percent

    def score(
        self,
        *,
        is_success: bool,
        performance: Optional[PerformanceResult],
        drift: Optional[DriftAnalysis],
        anomaly: Optional[AnomalyResult],
        failure_rate_percent: float,
    ) -> RiskResult:
        """
        Compute a deterministic risk score from pipeline signals.

        This method **never raises**.
        """
        # ── 1. Status component (binary: pass/fail) ─────────────────
        status_score = 0.0 if is_success else self.W_STATUS

        # ── 2. Performance component (scaled by deviation %) ────────
        performance_score = 0.0
        if performance and performance.deviation_percent is not None:
            deviation = abs(performance.deviation_percent)
            # Only count positive deviations (slower than avg) as risk
            if performance.deviation_percent > 0:
                ratio = _clamp(deviation / self.PERF_MAX_DEVIATION, 0.0, 1.0)
                performance_score = ratio * self.W_PERFORMANCE

                # Boost if it's a critical spike
                if performance.is_critical_spike:
                    performance_score = self.W_PERFORMANCE

        # ── 3. Schema drift component (scaled by diff count) ────────
        drift_score = 0.0
        if drift and drift.has_drift:
            count = drift.drift_count
            ratio = _clamp(count / self.DRIFT_MAX_DIFFS, 0.0, 1.0)
            drift_score = ratio * self.W_DRIFT

        # ── 4. AI / fallback severity component ──────────────────────
        ai_score = 0.0
        if anomaly and anomaly.anomaly_detected and (anomaly.ai_called or anomaly.used_fallback):
            # severity_score is 0–100; we scale to 0–W_AI
            ai_score = (anomaly.severity_score / 100.0) * self.W_AI

        # ── 5. Historical failure rate component ────────────────────
        history_score = 0.0
        if failure_rate_percent > 0:
            ratio = _clamp(failure_rate_percent / self.HISTORY_MAX_RATE, 0.0, 1.0)
            history_score = ratio * self.W_HISTORY

        # ── composite ──────────────────────────────────────────────
        total = _clamp(
            status_score + performance_score + drift_score + ai_score + history_score,
            0.0,
            100.0,
        )
        total = round(total, 1)

        return RiskResult(
            calculated_score=total,
            risk_level=_classify(total),
            status_score=round(status_score, 1),
            performance_score=round(performance_score, 1),
            drift_score=round(drift_score, 1),
            ai_score=round(ai_score, 1),
            history_score=round(history_score, 1),
        )


# ─── module-level singleton ─────────────────────────────────────────────

risk_engine = RiskEngine()
