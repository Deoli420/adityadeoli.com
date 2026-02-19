"""
Schema drift detection engine.

Sits in the monitoring pipeline between HTTP execution and AI analysis.
Compares the expected schema (stored on the endpoint) against the actual
response body (from the run) and returns a structured drift result.

Design:
  - Delegates the actual diffing to ``app.utils.schema_diff``.
  - Handles all edge cases where comparison is impossible (no schema,
    no response body, non-dict body) and returns a skip reason instead
    of raising.
  - Pure logic — no database access, no I/O.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

from app.utils.schema_diff import SchemaDiffResult, compute_diff

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class DriftAnalysis:
    """Result from the schema validator — passed through the pipeline."""

    diff: Optional[SchemaDiffResult] = None
    skipped_reason: Optional[str] = None

    @property
    def has_drift(self) -> bool:
        return self.diff is not None and self.diff.has_drift

    @property
    def drift_count(self) -> int:
        if self.diff is None:
            return 0
        return self.diff.total_differences


class SchemaValidator:
    """
    Compares expected schema against actual response body.

    Stateless — call ``validate()`` with the data and get a result.
    """

    def validate(
        self,
        *,
        expected_schema: Optional[dict[str, Any]],
        response_body: Optional[dict[str, Any]],
    ) -> DriftAnalysis:
        """
        Compare expected schema against actual response.

        Returns:
            ``DriftAnalysis`` with either a diff result or a skip reason.
        """
        # ── guard clauses ────────────────────────────────────────────
        if expected_schema is None:
            return DriftAnalysis(skipped_reason="No expected schema configured")

        if response_body is None:
            return DriftAnalysis(skipped_reason="No response body to compare")

        if not isinstance(expected_schema, dict):
            return DriftAnalysis(skipped_reason="Expected schema is not a dict")

        if not isinstance(response_body, dict):
            return DriftAnalysis(skipped_reason="Response body is not a dict")

        # ── compute diff ─────────────────────────────────────────────
        diff = compute_diff(expected=expected_schema, actual=response_body)

        if diff.has_drift:
            logger.warning(
                "Schema drift detected: %d difference(s)", diff.total_differences
            )
        else:
            logger.debug("Schema check passed — no drift")

        return DriftAnalysis(diff=diff)


# ─── module-level singleton ─────────────────────────────────────────────

schema_validator = SchemaValidator()
