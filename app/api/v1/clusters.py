import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, RequireAdmin, TenantId
from app.db.session import get_session
from app.models.incident_cluster import IncidentCluster
from app.repositories.cluster import ClusterRepository
from app.repositories.incident import IncidentRepository

router = APIRouter(prefix="/clusters", tags=["clusters"])


# ── Response Schemas ───────────────────────────────────────────

class IncidentSummary(BaseModel):
    id: uuid.UUID
    endpoint_id: uuid.UUID
    title: str
    status: str
    severity: str
    started_at: datetime

    model_config = {"from_attributes": True}


class ClusterListItem(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    shared_signals: list[str]
    member_count: int
    detected_at: datetime
    resolved_at: Optional[datetime] = None


class ClusterDetail(ClusterListItem):
    root_cause_summary: Optional[str] = None
    incidents: list[IncidentSummary]


class ClusterUpdate(BaseModel):
    title: Optional[str] = None
    root_cause_summary: Optional[str] = None


class MergeRequest(BaseModel):
    source_cluster_id: uuid.UUID


class AssignClusterRequest(BaseModel):
    cluster_id: uuid.UUID


# ── Helpers ────────────────────────────────────────────────────

def _get_repo(session: AsyncSession = Depends(get_session)) -> ClusterRepository:
    return ClusterRepository(session)


# ── Endpoints ──────────────────────────────────────────────────

@router.get("/", response_model=list[ClusterListItem])
async def list_clusters(
    user: CurrentUser,
    tenant_id: TenantId,
    repo: ClusterRepository = Depends(_get_repo),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
):
    clusters = await repo.list_by_org(tenant_id, status_filter=status_filter, limit=limit)
    items = []
    for cluster in clusters:
        count = await repo.get_member_count(cluster.id)
        items.append(
            ClusterListItem(
                id=cluster.id,
                title=cluster.title,
                status=cluster.status,
                shared_signals=cluster.shared_signals,
                member_count=count,
                detected_at=cluster.detected_at,
                resolved_at=cluster.resolved_at,
            )
        )
    return items


@router.get("/{cluster_id}", response_model=ClusterDetail)
async def get_cluster(
    cluster_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: ClusterRepository = Depends(_get_repo),
):
    cluster = await repo.get_by_id(cluster_id, tenant_id)
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
    count = await repo.get_member_count(cluster.id)
    return ClusterDetail(
        id=cluster.id,
        title=cluster.title,
        status=cluster.status,
        shared_signals=cluster.shared_signals,
        member_count=count,
        detected_at=cluster.detected_at,
        resolved_at=cluster.resolved_at,
        root_cause_summary=cluster.root_cause_summary,
        incidents=[IncidentSummary.model_validate(inc) for inc in cluster.incidents],
    )


@router.patch("/{cluster_id}", response_model=ClusterDetail, dependencies=[RequireAdmin])
async def update_cluster(
    cluster_id: uuid.UUID,
    body: ClusterUpdate,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: ClusterRepository = Depends(_get_repo),
):
    cluster = await repo.get_by_id(cluster_id, tenant_id)
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
    if body.title is not None:
        cluster.title = body.title
    if body.root_cause_summary is not None:
        cluster.root_cause_summary = body.root_cause_summary
    await repo.update(cluster)
    count = await repo.get_member_count(cluster.id)
    return ClusterDetail(
        id=cluster.id,
        title=cluster.title,
        status=cluster.status,
        shared_signals=cluster.shared_signals,
        member_count=count,
        detected_at=cluster.detected_at,
        resolved_at=cluster.resolved_at,
        root_cause_summary=cluster.root_cause_summary,
        incidents=[IncidentSummary.model_validate(inc) for inc in cluster.incidents],
    )


@router.post("/{cluster_id}/merge", response_model=ClusterDetail, dependencies=[RequireAdmin])
async def merge_clusters(
    cluster_id: uuid.UUID,
    body: MergeRequest,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: ClusterRepository = Depends(_get_repo),
    session: AsyncSession = Depends(get_session),
):
    target = await repo.get_by_id(cluster_id, tenant_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target cluster not found")

    source = await repo.get_by_id(body.source_cluster_id, tenant_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source cluster not found")

    if source.id == target.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot merge a cluster into itself")

    # Move all incidents from source to target
    for inc in source.incidents:
        inc.cluster_id = target.id

    source.status = "MERGED"
    source.merged_into_id = target.id

    await repo.update(source)
    await repo.update(target)

    # Reload target with updated incidents
    target = await repo.get_by_id(cluster_id, tenant_id)
    count = await repo.get_member_count(target.id)
    return ClusterDetail(
        id=target.id,
        title=target.title,
        status=target.status,
        shared_signals=target.shared_signals,
        member_count=count,
        detected_at=target.detected_at,
        resolved_at=target.resolved_at,
        root_cause_summary=target.root_cause_summary,
        incidents=[IncidentSummary.model_validate(inc) for inc in target.incidents],
    )


@router.post("/incidents/{incident_id}/assign-cluster", dependencies=[RequireAdmin])
async def assign_incident_to_cluster(
    incident_id: uuid.UUID,
    body: AssignClusterRequest,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: ClusterRepository = Depends(_get_repo),
    session: AsyncSession = Depends(get_session),
):
    # Verify cluster exists
    cluster = await repo.get_by_id(body.cluster_id, tenant_id)
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")

    inc_repo = IncidentRepository(session)
    incident = await inc_repo.get_by_id(incident_id, tenant_id=tenant_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    incident.cluster_id = body.cluster_id
    await inc_repo.update(incident)
    return {"status": "assigned", "incident_id": str(incident_id), "cluster_id": str(body.cluster_id)}


@router.delete("/incidents/{incident_id}/assign-cluster", dependencies=[RequireAdmin])
async def remove_incident_from_cluster(
    incident_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    inc_repo = IncidentRepository(session)
    incident = await inc_repo.get_by_id(incident_id, tenant_id=tenant_id)
    if incident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    incident.cluster_id = None
    await inc_repo.update(incident)
    return {"status": "removed", "incident_id": str(incident_id)}
