import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.monitoring.anomaly_engine import AnomalyEngine
from app.monitoring.api_runner import api_runner
from app.monitoring.performance_tracker import performance_tracker
from app.monitoring.runner_service import RunnerService
from app.ai.llm_client import llm_client
from app.repositories.api_run import ApiRunRepository
from app.schemas.anomaly_readout import AnomalyReadout
from app.schemas.monitor import MonitorRunResult
from app.schemas.performance import PerformanceReadout
from app.schemas.risk_readout import RiskReadout
from app.schemas.schema_drift import FieldDifference, SchemaDriftReadout

router = APIRouter(prefix="/monitor", tags=["monitor"])


def _get_runner_service(
    session: AsyncSession = Depends(get_session),
) -> RunnerService:
    return RunnerService(
        session=session,
        runner=api_runner,
        anomaly_engine=AnomalyEngine(llm=llm_client),
    )


# ── helper ───────────────────────────────────────────────────────────────

def _map_drift(pipeline) -> SchemaDriftReadout | None:
    """Convert internal DriftAnalysis to Pydantic SchemaDriftReadout."""
    drift = pipeline.schema_drift
    if drift is None:
        return None

    if drift.skipped_reason:
        return SchemaDriftReadout(skipped_reason=drift.skipped_reason)

    if drift.diff is None:
        return SchemaDriftReadout()

    d = drift.diff
    return SchemaDriftReadout(
        has_drift=d.has_drift,
        total_differences=d.total_differences,
        missing_fields=[
            FieldDifference(path=f.path, expected_type=f.expected)
            for f in d.missing_fields
        ],
        new_fields=[
            FieldDifference(path=f.path, actual_type=f.actual)
            for f in d.new_fields
        ],
        type_mismatches=[
            FieldDifference(path=f.path, expected_type=f.expected, actual_type=f.actual)
            for f in d.type_mismatches
        ],
    )


def _map_anomaly(pipeline) -> AnomalyReadout | None:
    """Convert internal AnomalyResult to Pydantic AnomalyReadout."""
    a = pipeline.anomaly
    if a is None:
        return None
    return AnomalyReadout(
        anomaly_detected=a.anomaly_detected,
        severity_score=a.severity_score,
        reasoning=a.reasoning,
        probable_cause=a.probable_cause,
        confidence=a.confidence,
        recommendation=a.recommendation,
        skipped_reason=a.skipped_reason,
        ai_called=a.ai_called,
        used_fallback=a.used_fallback,
    )


def _map_risk(pipeline) -> RiskReadout | None:
    """Convert internal RiskResult to Pydantic RiskReadout."""
    r = pipeline.risk
    if r is None:
        return None
    return RiskReadout(
        calculated_score=r.calculated_score,
        risk_level=r.risk_level,
        status_score=r.status_score,
        performance_score=r.performance_score,
        drift_score=r.drift_score,
        ai_score=r.ai_score,
        history_score=r.history_score,
    )


def _map_perf(pipeline) -> PerformanceReadout | None:
    """Convert internal PerformanceResult to Pydantic PerformanceReadout."""
    p = pipeline.performance
    if p is None:
        return None
    return PerformanceReadout(
        current_time_ms=p.current_time_ms,
        rolling_avg_ms=p.rolling_avg_ms,
        rolling_median_ms=p.rolling_median_ms,
        rolling_stddev_ms=p.rolling_stddev_ms,
        deviation_percent=p.deviation_percent,
        is_spike=p.is_spike,
        is_critical_spike=p.is_critical_spike,
        sample_size=p.sample_size,
        has_enough_data=p.has_enough_data,
    )


# ── routes ───────────────────────────────────────────────────────────────

@router.post(
    "/run/{endpoint_id}",
    response_model=MonitorRunResult,
    status_code=201,
    summary="Trigger a single test run for an endpoint",
)
async def trigger_run(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    service: RunnerService = Depends(_get_runner_service),
):
    """
    Immediately execute the registered API endpoint and store the result.

    Returns the ApiRun record together with real-time performance analysis
    and schema drift detection.
    """
    pipeline = await service.execute_endpoint(endpoint_id, tenant_id)

    return MonitorRunResult(
        run=pipeline.run,
        performance=_map_perf(pipeline),
        schema_drift=_map_drift(pipeline),
        anomaly=_map_anomaly(pipeline),
        risk=_map_risk(pipeline),
    )


@router.get(
    "/performance/{endpoint_id}",
    response_model=PerformanceReadout,
    summary="Get current performance stats for an endpoint",
)
async def get_performance(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    window: int = Query(default=20, ge=3, le=100),
    session: AsyncSession = Depends(get_session),
):
    """
    Query the rolling performance statistics for an endpoint
    without triggering a new run.
    """
    run_repo = ApiRunRepository(session)
    recent_times = await run_repo.get_recent_times(endpoint_id, limit=window + 1)

    if not recent_times:
        return PerformanceReadout(
            current_time_ms=0.0,
            sample_size=0,
            has_enough_data=False,
        )

    current = recent_times[0]
    historical = recent_times[1:]

    result = performance_tracker.analyse(
        current_time_ms=current,
        historical_times=historical,
    )

    return PerformanceReadout(
        current_time_ms=result.current_time_ms,
        rolling_avg_ms=result.rolling_avg_ms,
        rolling_median_ms=result.rolling_median_ms,
        rolling_stddev_ms=result.rolling_stddev_ms,
        deviation_percent=result.deviation_percent,
        is_spike=result.is_spike,
        is_critical_spike=result.is_critical_spike,
        sample_size=result.sample_size,
        has_enough_data=result.has_enough_data,
    )
