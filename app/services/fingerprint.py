"""
Fingerprint service — computes deterministic incident fingerprints
and finds similar/matching incidents across endpoints.
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass, field

from app.monitoring.runner_service import PipelineResult
from app.repositories.fingerprint import FingerprintRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class MatchResult:
    """Result of searching for similar incidents by fingerprint."""

    exact_match: dict | None = None
    fuzzy_matches: list[dict] = field(default_factory=list)
    cross_endpoint_matches: list[dict] = field(default_factory=list)


class FingerprintService:
    """Computes fingerprints and finds matching incidents."""

    # ── Static helpers ──────────────────────────────────────────────

    @staticmethod
    def compute_signal_flags(pipeline: PipelineResult) -> list[str]:
        """Extract boolean signal flags from a PipelineResult."""
        flags: list[str] = []

        # status_mismatch — run was not successful
        if pipeline.run and not pipeline.run.is_success:
            flags.append("status_mismatch")

        # latency_spike — performance deviation is high
        if pipeline.performance and pipeline.performance.is_spike:
            flags.append("latency_spike")

        # schema_drift — response schema has drifted
        if pipeline.schema_drift and pipeline.schema_drift.has_drift:
            flags.append("schema_drift")

        # security_finding — credential scan found issues
        if pipeline.security_scan and pipeline.security_scan.has_findings:
            flags.append("security_finding")

        # contract_violation — OpenAPI contract violations
        if pipeline.contract and pipeline.contract.has_violations:
            flags.append("contract_violation")

        # ai_anomaly — AI anomaly engine detected an anomaly
        if pipeline.anomaly and pipeline.anomaly.anomaly_detected:
            flags.append("ai_anomaly")

        return sorted(flags)

    @staticmethod
    def get_severity_band(pipeline: PipelineResult) -> str:
        """Return the risk level from the pipeline, defaulting to LOW."""
        if pipeline.risk and hasattr(pipeline.risk, "risk_level"):
            return pipeline.risk.risk_level
        return "LOW"

    @staticmethod
    def get_error_category(status_code: int | None) -> str:
        """Map an HTTP status code to a coarse error category."""
        if status_code is None:
            return "connection_error"
        if status_code == 0:
            return "timeout"
        if 200 <= status_code < 300:
            return "ok"
        if 400 <= status_code < 500:
            return "4xx"
        if 500 <= status_code < 600:
            return "5xx"
        return "unknown"

    @staticmethod
    def compute_fingerprint(
        signals: list[str],
        severity_band: str,
        error_category: str,
    ) -> str:
        """Produce a SHA-256 hex digest from the canonical signal string."""
        canonical = "|".join(sorted(signals)) + "|" + severity_band + "|" + error_category
        return hashlib.sha256(canonical.encode()).hexdigest()

    @staticmethod
    def compute_from_pipeline(pipeline: PipelineResult) -> tuple[str, list[str]]:
        """Convenience: compute fingerprint + signal flags from a PipelineResult."""
        signals = FingerprintService.compute_signal_flags(pipeline)
        severity_band = FingerprintService.get_severity_band(pipeline)
        error_category = FingerprintService.get_error_category(
            pipeline.run.status_code if pipeline.run else None
        )
        fp = FingerprintService.compute_fingerprint(signals, severity_band, error_category)
        return fp, signals

    @staticmethod
    def jaccard_similarity(a: set, b: set) -> float:
        """Jaccard index: |intersection| / |union|. Returns 0.0 for empty sets."""
        if not a and not b:
            return 0.0
        union = a | b
        if not union:
            return 0.0
        return len(a & b) / len(union)

    # ── Instance method — requires a repository ─────────────────────

    async def find_matches(
        self,
        repo: FingerprintRepository,
        fingerprint: str,
        signal_flags: list[str],
        endpoint_id,
        org_id,
    ) -> MatchResult:
        """
        Find exact, fuzzy, and cross-endpoint matches for a fingerprint.

        - exact_match: cache entry with same fingerprint on same endpoint
        - fuzzy_matches: resolved incidents on same endpoint with Jaccard >= 0.6
        - cross_endpoint_matches: cache entries on other endpoints in same org
        """
        import uuid as _uuid

        endpoint_id = _uuid.UUID(str(endpoint_id)) if not isinstance(endpoint_id, _uuid.UUID) else endpoint_id
        org_id = _uuid.UUID(str(org_id)) if not isinstance(org_id, _uuid.UUID) else org_id

        # 1. Exact match
        exact_entry = await repo.get_cache_entry(fingerprint, endpoint_id)
        exact_match = None
        if exact_entry is not None:
            exact_match = {
                "fingerprint": exact_entry.fingerprint,
                "occurrence_count": exact_entry.occurrence_count,
                "avg_resolution_ms": exact_entry.avg_resolution_ms,
                "last_resolution_notes": exact_entry.last_resolution_notes,
                "first_seen_at": str(exact_entry.first_seen_at) if exact_entry.first_seen_at else None,
                "last_seen_at": str(exact_entry.last_seen_at) if exact_entry.last_seen_at else None,
            }

        # 2. Fuzzy matches — Jaccard on resolved incidents from same endpoint
        fuzzy_matches: list[dict] = []
        current_flags = set(signal_flags)
        resolved = await repo.get_recent_resolved_with_fingerprints(endpoint_id)
        seen_fps: set[str] = set()
        for inc in resolved:
            if inc.fingerprint == fingerprint:
                continue  # skip exact match
            if inc.fingerprint in seen_fps:
                continue
            seen_fps.add(inc.fingerprint)
            # Retrieve the cache entry to get its signal flags
            cache = await repo.get_cache_entry(inc.fingerprint, endpoint_id)
            if cache is None:
                continue
            other_flags = set(cache.signal_flags) if cache.signal_flags else set()
            similarity = self.jaccard_similarity(current_flags, other_flags)
            if similarity >= 0.6:
                fuzzy_matches.append({
                    "fingerprint": inc.fingerprint,
                    "incident_id": str(inc.id),
                    "title": inc.title,
                    "similarity": round(similarity, 3),
                    "signal_flags": cache.signal_flags,
                    "resolved_at": str(inc.resolved_at) if inc.resolved_at else None,
                })
        fuzzy_matches.sort(key=lambda m: m["similarity"], reverse=True)

        # 3. Cross-endpoint matches
        cross_matches: list[dict] = []
        cross_entries = await repo.get_cross_endpoint_matches(fingerprint, org_id, endpoint_id)
        for entry in cross_entries:
            ep_name = ""
            if entry.endpoint and hasattr(entry.endpoint, "name"):
                ep_name = entry.endpoint.name
            cross_matches.append({
                "fingerprint": entry.fingerprint,
                "endpoint_id": str(entry.endpoint_id),
                "endpoint_name": ep_name,
                "occurrence_count": entry.occurrence_count,
                "avg_resolution_ms": entry.avg_resolution_ms,
                "last_resolution_notes": entry.last_resolution_notes,
            })

        return MatchResult(
            exact_match=exact_match,
            fuzzy_matches=fuzzy_matches,
            cross_endpoint_matches=cross_matches,
        )
