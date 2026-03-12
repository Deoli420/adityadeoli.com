import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.models.incident import Incident, IncidentEvent
from app.repositories.incident import IncidentRepository
from app.schemas.incident import (
    IncidentCreate,
    IncidentListItem,
    IncidentNoteCreate,
    IncidentStatusUpdate,
)


class IncidentService:
    def __init__(self, repo: IncidentRepository) -> None:
        self._repo = repo

    # ── CRUD ──────────────────────────────────────────────────────

    async def create_incident(
        self, data: IncidentCreate, tenant_id: uuid.UUID
    ) -> Incident:
        incident = Incident(
            endpoint_id=data.endpoint_id,
            organization_id=tenant_id,
            title=data.title,
            severity=data.severity,
            trigger_type=data.trigger_type,
            trigger_run_id=data.trigger_run_id,
            notes=data.notes,
            auto_resolve_after=data.auto_resolve_after,
        )
        incident = await self._repo.create(incident)

        # Add creation event
        await self._repo.add_event(
            IncidentEvent(
                incident_id=incident.id,
                event_type="created",
                detail={
                    "title": incident.title,
                    "severity": incident.severity,
                    "trigger_type": incident.trigger_type,
                },
            )
        )
        return incident

    async def get_incident(
        self, incident_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> Incident:
        incident = await self._repo.get_by_id(incident_id, tenant_id=tenant_id)
        if incident is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found",
            )
        return incident

    async def list_incidents(
        self,
        tenant_id: uuid.UUID,
        *,
        status_filter: str | None = None,
        limit: int = 50,
    ) -> list[IncidentListItem]:
        incidents = await self._repo.list_by_org(
            tenant_id, status_filter=status_filter, limit=limit
        )
        items = []
        for inc in incidents:
            # Eager-load endpoint name if available
            ep_name = ""
            if inc.endpoint:
                ep_name = inc.endpoint.name
            items.append(
                IncidentListItem(
                    id=inc.id,
                    endpoint_id=inc.endpoint_id,
                    title=inc.title,
                    status=inc.status,
                    severity=inc.severity,
                    trigger_type=inc.trigger_type,
                    started_at=inc.started_at,
                    resolved_at=inc.resolved_at,
                    endpoint_name=ep_name,
                )
            )
        return items

    async def list_by_endpoint(
        self,
        endpoint_id: uuid.UUID,
        tenant_id: uuid.UUID,
        *,
        limit: int = 20,
    ) -> list[Incident]:
        return await self._repo.list_by_endpoint(
            endpoint_id, tenant_id=tenant_id, limit=limit
        )

    async def update_status(
        self,
        incident_id: uuid.UUID,
        data: IncidentStatusUpdate,
        tenant_id: uuid.UUID,
    ) -> Incident:
        incident = await self.get_incident(incident_id, tenant_id)
        old_status = incident.status
        incident.status = data.status

        now = datetime.now(timezone.utc)
        if data.status == "INVESTIGATING" and incident.acknowledged_at is None:
            incident.acknowledged_at = now
        elif data.status == "RESOLVED":
            incident.resolved_at = now

        incident = await self._repo.update(incident)

        await self._repo.add_event(
            IncidentEvent(
                incident_id=incident.id,
                event_type="status_change",
                detail={"from": old_status, "to": data.status},
            )
        )
        return incident

    async def add_note(
        self,
        incident_id: uuid.UUID,
        data: IncidentNoteCreate,
        tenant_id: uuid.UUID,
    ) -> Incident:
        incident = await self.get_incident(incident_id, tenant_id)
        # Append to notes
        if incident.notes:
            incident.notes += f"\n\n---\n\n{data.note}"
        else:
            incident.notes = data.note

        incident = await self._repo.update(incident)

        await self._repo.add_event(
            IncidentEvent(
                incident_id=incident.id,
                event_type="note_added",
                detail={"note_preview": data.note[:200]},
            )
        )
        return incident

    async def get_timeline(
        self, incident_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> list[IncidentEvent]:
        # Verify access
        await self.get_incident(incident_id, tenant_id)
        return await self._repo.get_events(incident_id)

    # ── Auto-create / auto-resolve (called by scheduler) ──────────

    async def auto_create_from_anomaly(
        self,
        endpoint_id: uuid.UUID,
        organization_id: uuid.UUID,
        run_id: uuid.UUID,
        reasoning: str | None,
        severity_score: float,
    ) -> Incident | None:
        """Create an incident from an anomaly if no open incident exists."""
        existing = await self._repo.get_open_for_endpoint(endpoint_id)
        if existing is not None:
            return None  # Already have an open incident

        # Normalize: callers may pass 0-100 scale (risk engine) or 0.0-1.0
        normalized = severity_score / 100.0 if severity_score > 1.0 else severity_score

        severity = "LOW"
        if normalized >= 0.8:
            severity = "CRITICAL"
        elif normalized >= 0.6:
            severity = "HIGH"
        elif normalized >= 0.4:
            severity = "MEDIUM"

        title = reasoning[:200] if reasoning else "Anomaly detected"

        incident = Incident(
            endpoint_id=endpoint_id,
            organization_id=organization_id,
            title=title,
            severity=severity,
            trigger_type="anomaly",
            trigger_run_id=run_id,
        )
        incident = await self._repo.create(incident)

        await self._repo.add_event(
            IncidentEvent(
                incident_id=incident.id,
                event_type="created",
                detail={
                    "auto": True,
                    "severity": severity,
                    "severity_score": severity_score,
                    "trigger": "anomaly",
                },
            )
        )
        return incident

    async def check_auto_resolve(
        self,
        endpoint_id: uuid.UUID,
        consecutive_successes: int,
    ) -> Incident | None:
        """Auto-resolve an open incident if enough consecutive successes."""
        incident = await self._repo.get_open_for_endpoint(endpoint_id)
        if incident is None:
            return None

        if consecutive_successes < incident.auto_resolve_after:
            return None

        incident.status = "RESOLVED"
        incident.resolved_at = datetime.now(timezone.utc)
        incident = await self._repo.update(incident)

        await self._repo.add_event(
            IncidentEvent(
                incident_id=incident.id,
                event_type="auto_resolved",
                detail={
                    "consecutive_successes": consecutive_successes,
                    "threshold": incident.auto_resolve_after,
                },
            )
        )
        return incident
