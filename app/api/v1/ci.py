"""
CI endpoint — synchronous pipeline run for CLI/CI integration.

POST /ci/run  → accepts endpoint name or ID, returns full pipeline result.

This thin wrapper makes it easy for CLI/CI to trigger a run by name
without needing to look up the endpoint ID first.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.monitoring.anomaly_engine import AnomalyEngine
from app.monitoring.api_runner import api_runner
from app.monitoring.runner_service import RunnerService
from app.repositories.api_endpoint import ApiEndpointRepository

router = APIRouter(prefix="/ci", tags=["ci"])


class CiRunResponse(BaseModel):
    endpoint_id: str
    endpoint_name: str
    status_code: int | None = None
    response_time_ms: float | None = None
    is_success: bool = False
    risk_score: float = 0.0
    risk_level: str = "LOW"
    anomaly_detected: bool = False
    anomaly_severity: float = 0.0
    security_findings: int = 0


@router.post("/run", response_model=CiRunResponse)
async def ci_run(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    endpoint_id: str | None = Query(None, description="Endpoint UUID"),
    name: str | None = Query(None, description="Endpoint name (alternative to ID)"),
):
    """
    Trigger a synchronous pipeline run.

    Accepts either endpoint_id (UUID) or name (partial match).
    Returns a flat summary suitable for CI exit-code decisions.
    """
    repo = ApiEndpointRepository(session)

    # Resolve endpoint
    ep_uuid: uuid.UUID | None = None

    if endpoint_id:
        try:
            ep_uuid = uuid.UUID(endpoint_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid UUID: {endpoint_id}",
            )
    elif name:
        # Find by name — prefer exact match, then fall back to substring
        all_eps = await repo.get_all(tenant_id)
        exact = [e for e in all_eps if e.name.lower() == name.lower()]
        if exact:
            # Use the first exact match (most recently created wins via DB ordering)
            ep_uuid = exact[0].id
        else:
            matches = [e for e in all_eps if name.lower() in e.name.lower()]
            if len(matches) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No endpoint matching '{name}'",
                )
            if len(matches) > 1:
                names = ", ".join(e.name for e in matches[:5])
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Multiple matches: {names}. Be more specific.",
                )
            ep_uuid = matches[0].id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide endpoint_id or name query parameter",
        )

    # Run the pipeline
    from app.ai.llm_client import llm_client

    anomaly_engine = AnomalyEngine(llm_client) if llm_client.available else None

    service = RunnerService(
        session=session,
        runner=api_runner,
        anomaly_engine=anomaly_engine,
    )

    result = await service.execute_endpoint(ep_uuid, tenant_id)
    await session.commit()

    return CiRunResponse(
        endpoint_id=str(ep_uuid),
        endpoint_name=result.endpoint_name,
        status_code=result.run.status_code,
        response_time_ms=result.run.response_time_ms,
        is_success=result.run.is_success,
        risk_score=result.risk.calculated_score if result.risk else 0.0,
        risk_level=result.risk.risk_level if result.risk else "LOW",
        anomaly_detected=result.anomaly.anomaly_detected if result.anomaly else False,
        anomaly_severity=result.anomaly.severity_score if result.anomaly else 0.0,
        security_findings=result.security_scan.total_findings if result.security_scan else 0,
    )
