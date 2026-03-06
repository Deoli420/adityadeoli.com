"""
Contract Testing API — OpenAPI spec upload and validation.

Endpoints:
  POST /contracts/{endpoint_id}/upload   → upload OpenAPI spec
  GET  /contracts/{endpoint_id}/violations → latest contract violations
  POST /contracts/{endpoint_id}/validate  → manual validation trigger
"""

import json
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.monitoring.contract_validator import contract_validator
from app.repositories.api_endpoint import ApiEndpointRepository
from app.repositories.api_run import ApiRunRepository
from app.schemas.contract import (
    ContractValidationResponse,
    SpecUploadResponse,
    ViolationResponse,
)

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.post(
    "/{endpoint_id}/upload",
    response_model=SpecUploadResponse,
)
async def upload_spec(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
    spec: dict = Body(..., description="OpenAPI spec as JSON"),
):
    """Upload an OpenAPI spec for contract validation."""
    repo = ApiEndpointRepository(session)
    endpoint = await repo.get_by_id(endpoint_id, tenant_id)

    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Endpoint {endpoint_id} not found",
        )

    # Basic validation: must have at least "openapi" or "swagger" key
    if not isinstance(spec, dict) or not (
        spec.get("openapi") or spec.get("swagger")
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OpenAPI spec: missing 'openapi' or 'swagger' field",
        )

    # Store the spec
    endpoint.openapi_spec = spec
    await session.flush()
    await session.commit()

    paths_count = len(spec.get("paths", {}))

    return SpecUploadResponse(
        message="OpenAPI spec uploaded successfully",
        endpoint_id=str(endpoint_id),
        paths_count=paths_count,
    )


@router.get(
    "/{endpoint_id}/violations",
    response_model=ContractValidationResponse,
)
async def get_violations(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """
    Validate the latest run's response against the stored OpenAPI spec.
    """
    repo = ApiEndpointRepository(session)
    endpoint = await repo.get_by_id(endpoint_id, tenant_id)

    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Endpoint {endpoint_id} not found",
        )

    if not endpoint.openapi_spec:
        return ContractValidationResponse(
            has_violations=False,
            total_violations=0,
            violations=[],
        )

    # Get latest run
    run_repo = ApiRunRepository(session)
    runs = await run_repo.get_by_endpoint(endpoint_id, tenant_id=tenant_id, limit=1)

    if not runs:
        return ContractValidationResponse(
            has_violations=False,
            total_violations=0,
            violations=[],
        )

    run = runs[0]

    result = contract_validator.validate(
        openapi_spec=endpoint.openapi_spec,
        url=endpoint.url,
        method=endpoint.method,
        status_code=run.status_code,
        response_body=run.response_body,
    )

    return ContractValidationResponse(
        has_violations=result.has_violations,
        total_violations=result.total_violations,
        violations=[
            ViolationResponse(
                rule=v.rule,
                path=v.path,
                message=v.message,
                severity=v.severity,
            )
            for v in result.violations
        ],
    )


@router.post(
    "/{endpoint_id}/validate",
    response_model=ContractValidationResponse,
)
async def trigger_validation(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """
    Trigger a fresh monitoring run and validate the response against the spec.
    """
    repo = ApiEndpointRepository(session)
    endpoint = await repo.get_by_id(endpoint_id, tenant_id)

    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Endpoint {endpoint_id} not found",
        )

    if not endpoint.openapi_spec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OpenAPI spec uploaded for this endpoint. Upload one first.",
        )

    # Run the pipeline
    from app.ai.llm_client import llm_client
    from app.monitoring.anomaly_engine import AnomalyEngine
    from app.monitoring.api_runner import ApiRunner
    from app.monitoring.runner_service import RunnerService

    anomaly_engine = AnomalyEngine(llm_client) if llm_client.available else None

    service = RunnerService(
        session=session,
        runner=ApiRunner(),
        anomaly_engine=anomaly_engine,
    )

    pipeline_result = await service.execute_endpoint(endpoint_id, tenant_id)
    await session.commit()

    # Validate against spec
    result = contract_validator.validate(
        openapi_spec=endpoint.openapi_spec,
        url=endpoint.url,
        method=endpoint.method,
        status_code=pipeline_result.run.status_code,
        response_body=pipeline_result.run.response_body,
    )

    return ContractValidationResponse(
        has_violations=result.has_violations,
        total_violations=result.total_violations,
        violations=[
            ViolationResponse(
                rule=v.rule,
                path=v.path,
                message=v.message,
                severity=v.severity,
            )
            for v in result.violations
        ],
    )
