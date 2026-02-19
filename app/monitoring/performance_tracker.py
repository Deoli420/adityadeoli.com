"""
Performance tracking engine.

Responsibilities:
  - Calculate rolling average response time from the last N runs.
  - Calculate deviation percentage of the current run vs the rolling average.
  - Detect abnormal performance spikes using configurable thresholds.
  - Return a structured, immutable result — never touch the database.

This module is a pure computation layer.  It receives pre-fetched data
(response times list + current run time) and returns analysis.
Database access is handled by the caller (RunnerService).
"""

from __future__ import annotations

import logging
import statistics
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ─── defaults ───────────────────────────────────────────────────────────
DEFAULT_WINDOW_SIZE = 20
SPIKE_THRESHOLD_PERCENT = 50.0  # deviation ≥ 50% = spike
CRITICAL_SPIKE_THRESHOLD_PERCENT = 150.0  # deviation ≥ 150% = critical spike


@dataclass(frozen=True, slots=True)
class PerformanceResult:
    """Immutable performance analysis for a single run."""

    current_time_ms: float
    rolling_avg_ms: float | None
    rolling_median_ms: float | None
    rolling_stddev_ms: float | None
    deviation_percent: float | None
    is_spike: bool
    is_critical_spike: bool
    sample_size: int

    @property
    def has_enough_data(self) -> bool:
        """At least 3 data points needed for meaningful analysis."""
        return self.sample_size >= 3


class PerformanceTracker:
    """
    Stateless performance analyser.

    Takes a list of historical response times and the current run time,
    returns a ``PerformanceResult`` with rolling stats and spike flags.

    No database access — designed to be called with pre-fetched data.
    """

    def __init__(
        self,
        *,
        window_size: int = DEFAULT_WINDOW_SIZE,
        spike_threshold_percent: float = SPIKE_THRESHOLD_PERCENT,
        critical_spike_threshold_percent: float = CRITICAL_SPIKE_THRESHOLD_PERCENT,
    ) -> None:
        self._window_size = window_size
        self._spike_threshold = spike_threshold_percent
        self._critical_spike_threshold = critical_spike_threshold_percent

    def analyse(
        self,
        *,
        current_time_ms: float,
        historical_times: list[float],
    ) -> PerformanceResult:
        """
        Analyse performance of the current run against historical data.

        Args:
            current_time_ms: Response time of the current run.
            historical_times: Recent response times (newest first),
                              *excluding* the current run.

        Returns:
            ``PerformanceResult`` with rolling stats and spike detection.
        """
        # Trim to window size (list should already be limited by repository,
        # but we enforce it here for safety).
        window = historical_times[: self._window_size]
        sample_size = len(window)

        if sample_size < 2:
            # Not enough history — return baseline with no deviation.
            return PerformanceResult(
                current_time_ms=current_time_ms,
                rolling_avg_ms=window[0] if sample_size == 1 else None,
                rolling_median_ms=window[0] if sample_size == 1 else None,
                rolling_stddev_ms=None,
                deviation_percent=None,
                is_spike=False,
                is_critical_spike=False,
                sample_size=sample_size,
            )

        rolling_avg = statistics.mean(window)
        rolling_median = statistics.median(window)
        rolling_stddev = statistics.stdev(window)

        # Deviation: how far the current run is from the rolling average.
        if rolling_avg > 0:
            deviation_pct = round(
                ((current_time_ms - rolling_avg) / rolling_avg) * 100, 2
            )
        else:
            deviation_pct = 0.0

        is_spike = deviation_pct >= self._spike_threshold
        is_critical = deviation_pct >= self._critical_spike_threshold

        if is_critical:
            logger.warning(
                "CRITICAL spike: %.1f ms vs avg %.1f ms (%.1f%% deviation)",
                current_time_ms,
                rolling_avg,
                deviation_pct,
            )
        elif is_spike:
            logger.info(
                "Performance spike: %.1f ms vs avg %.1f ms (%.1f%% deviation)",
                current_time_ms,
                rolling_avg,
                deviation_pct,
            )

        return PerformanceResult(
            current_time_ms=round(current_time_ms, 2),
            rolling_avg_ms=round(rolling_avg, 2),
            rolling_median_ms=round(rolling_median, 2),
            rolling_stddev_ms=round(rolling_stddev, 2),
            deviation_percent=deviation_pct,
            is_spike=is_spike,
            is_critical_spike=is_critical,
            sample_size=sample_size,
        )


# ─── module-level singleton ─────────────────────────────────────────────

performance_tracker = PerformanceTracker()
