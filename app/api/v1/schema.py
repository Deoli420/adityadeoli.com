"""
Schema History API — schema drift versioning, timeline, and diff comparison.

Endpoints:
  GET  /{endpoint_id}/history     -> chronological drift events (snapshots with diffs)
  GET  /{endpoint_id}/snapshots   -> all schema snapshots
  GET  /{endpoint_id}/diff/{a}/{b} -> compare two snapshots side-by-side
  POST /{endpoint_id}/accept      -> accept current response as new expected schema
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.repositories.api_endpoint import ApiEndpointRepository
from app.repositories.schema_snapshot import SchemaSnapshotRepository
from app.schemas.schema_snapshot import (
    SchemaDiffResponse,
    SchemaHistoryResponse,
    SchemaSnapshotResponse,
)
from app.services.schema_snapshot import snapshot_if_changed
from app.utils.schema_diff import compute_diff

router = APIRouter(prefix="/schema", tags=["schema"])


@router.get("/{endpoint_id}/history", response_model=SchemaHistoryResponse)
async def get_schema_history(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    """Chronological schema drift events — snapshots that have diffs."""
    repo = SchemaSnapshotRepository(session)
    snapshots = await repo.get_history(endpoint_id, tenant_id, limit=limit)

    return SchemaHistoryResponse(
        snapshots=[
            SchemaSnapshotResponse(
                id=s.id,
                endpoint_id=s.endpoint_id,
                schema_hash=s.schema_hash,
                field_count=s.field_count,
                diff_summary=s.diff_from_previous,
                created_at=s.created_at,
            )
            for s in snapshots
        ]
    )


@router.get("/{endpoint_id}/snapshots", response_model=SchemaHistoryResponse)
async def get_schema_snapshots(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    """All schema snapshots for the endpoint, newest first."""
    repo = SchemaSnapshotRepository(session)
    snapshots = await repo.get_history(endpoint_id, tenant_id, limit=limit)

    return SchemaHistoryResponse(
        snapshots=[
            SchemaSnapshotResponse(
                id=s.id,
                endpoint_id=s.endpoint_id,
                schema_hash=s.schema_hash,
                field_count=s.field_count,
                diff_summary=s.diff_from_previous,
                created_at=s.created_at,
            )
            for s in snapshots
        ]
    )


@router.get(
    "/{endpoint_id}/diff/{snap_a}/{snap_b}",
    response_model=SchemaDiffResponse,
)
async def get_schema_diff(
    endpoint_id: uuid.UUID,
    snap_a: uuid.UUID,
    snap_b: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Compare two schema snapshots side-by-side."""
    repo = SchemaSnapshotRepository(session)

    snapshot_a = await repo.get_by_id(snap_a, tenant_id)
    if snapshot_a is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snap_a} not found",
        )

    snapshot_b = await repo.get_by_id(snap_b, tenant_id)
    if snapshot_b is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Snapshot {snap_b} not found",
        )

    diff_result = compute_diff(
        expected=snapshot_a.schema_body,
        actual=snapshot_b.schema_body,
    )

    return SchemaDiffResponse(
        snapshot_a_id=snap_a,
        snapshot_b_id=snap_b,
        diff=diff_result.to_summary_dict(),
    )


@router.post("/{endpoint_id}/accept", response_model=SchemaSnapshotResponse)
async def accept_schema(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """
    Accept the current response schema as the new expected schema.

    Fetches the latest snapshot and sets it as the endpoint's expected_schema.
    Also creates a snapshot if one doesn't exist yet.
    """
    endpoint_repo = ApiEndpointRepository(session)
    endpoint = await endpoint_repo.get_by_id(endpoint_id, tenant_id)
    if endpoint is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Endpoint {endpoint_id} not found",
        )

    snapshot_repo = SchemaSnapshotRepository(session)
    latest = await snapshot_repo.get_latest(endpoint_id, tenant_id)

    if latest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No schema snapshots found. Run the monitor first.",
        )

    # Update the endpoint's expected_schema to match the latest snapshot
    endpoint.expected_schema = latest.schema_body
    await endpoint_repo.update(endpoint)

    return SchemaSnapshotResponse(
        id=latest.id,
        endpoint_id=latest.endpoint_id,
        schema_hash=latest.schema_hash,
        field_count=latest.field_count,
        diff_summary=latest.diff_from_previous,
        created_at=latest.created_at,
    )
