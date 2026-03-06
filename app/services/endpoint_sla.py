import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.models.endpoint_sla import EndpointSLA
from app.repositories.api_run import ApiRunRepository
from app.repositories.endpoint_sla import EndpointSLARepository
from app.schemas.endpoint_sla import EndpointSLACreate, EndpointSLAUpdate, UptimeStats


_WINDOW_HOURS = {"24h": 24, "7d": 168, "30d": 720}


class EndpointSLAService:
    def __init__(
        self,
        repo: EndpointSLARepository,
        run_repo: ApiRunRepository,
    ) -> None:
        self._repo = repo
        self._run_repo = run_repo

    # ── CRUD ──────────────────────────────────────────────────────

    async def create_sla(
        self, data: EndpointSLACreate, tenant_id: uuid.UUID
    ) -> EndpointSLA:
        existing = await self._repo.get_by_endpoint(
            data.endpoint_id, tenant_id=tenant_id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="SLA config already exists for this endpoint",
            )
        sla = EndpointSLA(
            endpoint_id=data.endpoint_id,
            organization_id=tenant_id,
            sla_target_percent=data.sla_target_percent,
            uptime_window=data.uptime_window,
        )
        return await self._repo.create(sla)

    async def get_sla(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> EndpointSLA:
        sla = await self._repo.get_by_endpoint(endpoint_id, tenant_id=tenant_id)
        if sla is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No SLA config for endpoint {endpoint_id}",
            )
        return sla

    async def update_sla(
        self,
        endpoint_id: uuid.UUID,
        data: EndpointSLAUpdate,
        tenant_id: uuid.UUID,
    ) -> EndpointSLA:
        sla = await self.get_sla(endpoint_id, tenant_id)
        if data.sla_target_percent is not None:
            sla.sla_target_percent = data.sla_target_percent
        if data.uptime_window is not None:
            sla.uptime_window = data.uptime_window
        if data.is_active is not None:
            sla.is_active = data.is_active
        return await self._repo.update(sla)

    async def delete_sla(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> None:
        sla = await self.get_sla(endpoint_id, tenant_id)
        await self._repo.delete(sla)

    # ── Uptime computation ────────────────────────────────────────

    async def get_uptime(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> UptimeStats:
        sla = await self.get_sla(endpoint_id, tenant_id)
        hours = _WINDOW_HOURS.get(sla.uptime_window, 24)
        since = datetime.now(timezone.utc) - timedelta(hours=hours)

        total, successes = await self._run_repo.get_uptime_stats(
            endpoint_id, since=since
        )

        uptime = round((successes / total * 100) if total else 100.0, 4)
        return UptimeStats(
            endpoint_id=endpoint_id,
            uptime_percent=uptime,
            total_runs=total,
            successful_runs=successes,
            window=sla.uptime_window,
            sla_target=sla.sla_target_percent,
            is_breached=uptime < sla.sla_target_percent,
        )

    async def check_breach(
        self, endpoint_id: uuid.UUID, tenant_id: uuid.UUID
    ) -> bool:
        """Return True if the endpoint is currently breaching its SLA."""
        try:
            uptime = await self.get_uptime(endpoint_id, tenant_id)
            return uptime.is_breached
        except HTTPException:
            return False
