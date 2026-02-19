"""
Runner service — orchestrates the monitoring pipeline for a single endpoint.

Flow:
  1. Load the ApiEndpoint from the database.
  2. Call ApiRunner.execute() to perform the HTTP request.
  3. Persist the result as an ApiRun record.
  4. Run performance analysis against historical response times.
  5. Run schema drift detection (expected vs actual body).
  6. Run AI anomaly analysis (cost-gated — only when signals warrant it).
  7. Persist anomaly record if an anomaly was detected.
  8. Compute deterministic risk score from all pipeline signals.
  9. Persist risk score record.
  10. Return PipelineResult(run, performance, schema_drift, anomaly, risk).

This service owns the "execute → store → analyse" contract.
"""

from __future__ import annotations

import base64
import logging
import uuid
from dataclasses import dataclass
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.anomaly import Anomaly
from app.models.api_run import ApiRun
from app.models.risk_score import RiskScore
from app.monitoring.anomaly_engine import AnomalyEngine, AnomalyResult
from app.monitoring.api_runner import ApiRunner, RunnerConfig
from app.monitoring.performance_tracker import PerformanceResult, PerformanceTracker
from app.monitoring.risk_engine import RiskEngine, RiskResult
from app.monitoring.schema_validator import DriftAnalysis, SchemaValidator
from app.repositories.anomaly import AnomalyRepository
from app.repositories.api_endpoint import ApiEndpointRepository
from app.repositories.api_run import ApiRunRepository
from app.repositories.risk_score import RiskScoreRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class PipelineResult:
    """Immutable output of the full monitoring pipeline for one run."""

    run: ApiRun
    performance: Optional[PerformanceResult] = None
    schema_drift: Optional[DriftAnalysis] = None
    anomaly: Optional[AnomalyResult] = None
    risk: Optional[RiskResult] = None

    # Endpoint metadata — avoids extra DB queries downstream (alerts, logs)
    endpoint_name: str = ""
    endpoint_url: str = ""
    endpoint_method: str = ""


class RunnerService:
    """
    Coordinates: load endpoint → execute HTTP → persist ApiRun → analyse.

    Dependencies are injected through the constructor so the class
    remains testable without a running server.
    """

    def __init__(
        self,
        session: AsyncSession,
        runner: ApiRunner,
        *,
        tracker: PerformanceTracker | None = None,
        validator: SchemaValidator | None = None,
        anomaly_engine: AnomalyEngine | None = None,
        risk_engine: RiskEngine | None = None,
        config: RunnerConfig | None = None,
    ) -> None:
        self._endpoint_repo = ApiEndpointRepository(session)
        self._run_repo = ApiRunRepository(session)
        self._anomaly_repo = AnomalyRepository(session)
        self._risk_repo = RiskScoreRepository(session)
        self._runner = runner
        self._tracker = tracker or PerformanceTracker()
        self._validator = validator or SchemaValidator()
        self._anomaly_engine = anomaly_engine
        self._risk_engine = risk_engine or RiskEngine()
        self._config = config

    @staticmethod
    def _build_v2_config(
        endpoint: Any,
    ) -> tuple[dict[str, str], dict[str, str], str | None, str | None]:
        """
        Extract V2 advanced config from an endpoint model into plain
        dicts suitable for httpx.

        Returns:
            (headers, query_params, body_content, content_type)
        """
        headers: dict[str, str] = {}
        query_params: dict[str, str] = {}
        body_content: str | None = None
        content_type: str | None = None

        # ── Request headers ──────────────────────────────────────────
        if endpoint.request_headers:
            for h in endpoint.request_headers:
                if isinstance(h, dict) and h.get("enabled", True) and h.get("key", "").strip():
                    headers[h["key"]] = h.get("value", "")

        # ── Cookies → Cookie header ──────────────────────────────────
        if endpoint.cookies:
            cookie_parts = []
            for c in endpoint.cookies:
                if isinstance(c, dict) and c.get("enabled", True) and c.get("key", "").strip():
                    cookie_parts.append(f"{c['key']}={c.get('value', '')}")
            if cookie_parts:
                headers["Cookie"] = "; ".join(cookie_parts)

        # ── Auth config ──────────────────────────────────────────────
        if endpoint.auth_config and isinstance(endpoint.auth_config, dict):
            auth_type = endpoint.auth_config.get("type", "none")
            if auth_type == "bearer":
                bearer = endpoint.auth_config.get("bearer", {}) or {}
                token = bearer.get("token", "").strip()
                if token:
                    headers["Authorization"] = f"Bearer {token}"
            elif auth_type == "basic":
                basic = endpoint.auth_config.get("basic", {}) or {}
                username = basic.get("username", "")
                password = basic.get("password", "")
                if username.strip():
                    encoded = base64.b64encode(f"{username}:{password}".encode()).decode()
                    headers["Authorization"] = f"Basic {encoded}"
            elif auth_type == "api-key":
                api_key = endpoint.auth_config.get("api_key", {}) or endpoint.auth_config.get("apiKey", {}) or {}
                key_name = api_key.get("key", "").strip()
                key_value = api_key.get("value", "")
                add_to = api_key.get("addTo", "header")
                if key_name:
                    if add_to == "query":
                        query_params[key_name] = key_value
                    else:
                        headers[key_name] = key_value

        # ── Query params ─────────────────────────────────────────────
        if endpoint.query_params:
            for p in endpoint.query_params:
                if isinstance(p, dict) and p.get("enabled", True) and p.get("key", "").strip():
                    query_params[p["key"]] = p.get("value", "")

        # ── Body config ──────────────────────────────────────────────
        if endpoint.body_config and isinstance(endpoint.body_config, dict):
            btype = endpoint.body_config.get("type", "none")
            if btype == "json":
                body_content = endpoint.body_config.get("raw", "")
                content_type = "application/json"
            elif btype == "x-www-form-urlencoded":
                form_fields = endpoint.body_config.get("form_fields", []) or []
                pairs = []
                for f in form_fields:
                    if isinstance(f, dict) and f.get("enabled", True) and f.get("key", "").strip():
                        pairs.append(f"{f['key']}={f.get('value', '')}")
                if pairs:
                    body_content = "&".join(pairs)
                    content_type = "application/x-www-form-urlencoded"

        return headers, query_params, body_content, content_type

    async def execute_endpoint(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID | None = None
    ) -> PipelineResult:
        """
        Run a single endpoint test and return the full pipeline result.

        Args:
            endpoint_id: The endpoint to execute.
            tenant_id: If provided, enforce tenant isolation.

        Raises:
            HTTPException 404 if endpoint_id does not exist.
        """
        # 1. Load endpoint
        endpoint = await self._endpoint_repo.get_by_id(endpoint_id, tenant_id)
        if endpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"API endpoint {endpoint_id} not found",
            )

        logger.info(
            "Executing %s %s (expected %d)",
            endpoint.method,
            endpoint.url,
            endpoint.expected_status,
        )

        # 2. Build V2 request config (headers, auth, params, body) from endpoint
        extra_headers, extra_params, body_content, body_ct = self._build_v2_config(
            endpoint
        )

        # 3. Execute HTTP request
        result = await self._runner.execute(
            url=endpoint.url,
            method=endpoint.method,
            expected_status=endpoint.expected_status,
            config=self._config,
            headers=extra_headers or None,
            params=extra_params or None,
            content=body_content,
            content_type=body_ct,
        )

        # 4. Persist as ApiRun
        run = ApiRun(
            endpoint_id=endpoint.id,
            organization_id=endpoint.organization_id,
            status_code=result.status_code,
            response_time_ms=result.response_time_ms,
            response_body=result.response_body,
            is_success=result.is_success,
            error_message=result.error_message,
        )
        saved_run = await self._run_repo.create(run)

        logger.info(
            "Run %s for endpoint %s: success=%s status=%s time=%.1fms",
            saved_run.id,
            endpoint.name,
            result.is_success,
            result.status_code,
            result.response_time_ms or 0,
        )

        # 4. Performance analysis (only if we got a response time)
        perf: PerformanceResult | None = None
        if result.response_time_ms is not None:
            historical = await self._run_repo.get_recent_times(
                endpoint.id, limit=20
            )
            if historical and historical[0] == result.response_time_ms:
                historical = historical[1:]

            perf = self._tracker.analyse(
                current_time_ms=result.response_time_ms,
                historical_times=historical,
            )
            logger.info(
                "Performance for %s: avg=%.1fms dev=%.1f%% spike=%s",
                endpoint.name,
                perf.rolling_avg_ms or 0,
                perf.deviation_percent or 0,
                perf.is_spike,
            )

        # 5. Schema drift detection
        drift = self._validator.validate(
            expected_schema=endpoint.expected_schema,
            response_body=result.response_body,
        )
        if drift.has_drift:
            logger.warning(
                "Schema drift for %s: %d difference(s)",
                endpoint.name,
                drift.drift_count,
            )

        # 6. Historical failure rate (shared by anomaly engine and risk scorer)
        failure_rate = await self._run_repo.get_failure_rate(endpoint.id)

        # 7. AI anomaly analysis (cost-gated)
        anomaly: AnomalyResult | None = None
        if self._anomaly_engine is not None:
            anomaly = await self._anomaly_engine.analyse(
                endpoint_name=endpoint.name,
                url=endpoint.url,
                method=endpoint.method,
                expected_status=endpoint.expected_status,
                actual_status=result.status_code,
                response_time_ms=result.response_time_ms,
                is_success=result.is_success,
                error_message=result.error_message,
                performance=perf,
                drift=drift,
                failure_rate_percent=failure_rate,
            )

            logger.info(
                "Anomaly analysis for %s: detected=%s severity=%.0f ai_called=%s%s",
                endpoint.name,
                anomaly.anomaly_detected,
                anomaly.severity_score,
                anomaly.ai_called,
                f" (skipped: {anomaly.skipped_reason})" if anomaly.skipped_reason else "",
            )

            # 8. Persist anomaly record if AI detected one
            if anomaly.anomaly_detected:
                anomaly_record = Anomaly(
                    api_run_id=saved_run.id,
                    anomaly_detected=anomaly.anomaly_detected,
                    severity_score=anomaly.severity_score,
                    reasoning=anomaly.reasoning,
                    probable_cause=anomaly.probable_cause,
                )
                await self._anomaly_repo.create(anomaly_record)
                logger.info(
                    "Anomaly persisted for run %s (severity=%.0f)",
                    saved_run.id,
                    anomaly.severity_score,
                )

        # 9. Risk scoring (deterministic, always runs)
        risk = self._risk_engine.score(
            is_success=result.is_success,
            performance=perf,
            drift=drift,
            anomaly=anomaly,
            failure_rate_percent=failure_rate,
        )

        logger.info(
            "Risk for %s: score=%.1f level=%s [status=%.0f perf=%.0f drift=%.0f ai=%.0f hist=%.0f]",
            endpoint.name,
            risk.calculated_score,
            risk.risk_level,
            risk.status_score,
            risk.performance_score,
            risk.drift_score,
            risk.ai_score,
            risk.history_score,
        )

        # 10. Persist risk score
        risk_record = RiskScore(
            api_run_id=saved_run.id,
            calculated_score=risk.calculated_score,
            risk_level=risk.risk_level,
        )
        await self._risk_repo.create(risk_record)

        return PipelineResult(
            run=saved_run,
            performance=perf,
            schema_drift=drift,
            anomaly=anomaly,
            risk=risk,
            endpoint_name=endpoint.name,
            endpoint_url=endpoint.url,
            endpoint_method=endpoint.method,
        )
