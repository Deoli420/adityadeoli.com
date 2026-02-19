"""
Scheduler engine — manages periodic monitoring jobs via APScheduler.

Responsibilities:
  - Start/stop an ``AsyncIOScheduler`` with the FastAPI lifespan.
  - Sync scheduled jobs to the database on startup and on demand.
  - Each ``ApiEndpoint`` gets its own interval job based on
    ``monitoring_interval_seconds``.
  - Jobs are added, updated, or removed when endpoints change.
  - Exposes status information for the API layer.

Design:
  - Uses APScheduler 3.x ``AsyncIOScheduler`` (in-memory job store).
  - Each job calls ``run_endpoint`` from the jobs module.
  - Concurrent execution is limited via ``SCHEDULER_MAX_CONCURRENT``.
  - Resilient: a failing job never crashes the scheduler.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings

logger = logging.getLogger(__name__)


class MonitorScheduler:
    """
    Lifecycle wrapper around APScheduler.

    Call ``startup()`` and ``shutdown()`` from the FastAPI lifespan.
    Call ``sync_jobs()`` after startup to load endpoints from the DB.
    """

    def __init__(self) -> None:
        self._scheduler: AsyncIOScheduler | None = None
        self._started_at: datetime | None = None

    # ── lifecycle ────────────────────────────────────────────────────

    def startup(self) -> None:
        """Create and start the scheduler.  Idempotent."""
        if not settings.SCHEDULER_ENABLED:
            logger.info("Scheduler disabled via SCHEDULER_ENABLED=False")
            return

        if self._scheduler is not None:
            logger.warning("Scheduler already started — skipping")
            return

        self._scheduler = AsyncIOScheduler(
            job_defaults={
                "coalesce": True,           # merge missed runs into one
                "max_instances": 1,          # one instance per job at a time
                "misfire_grace_time": 60,    # seconds of grace for misfired jobs
            },
        )
        self._scheduler.start()
        self._started_at = datetime.now(timezone.utc)
        logger.info(
            "Scheduler started (max_concurrent=%d)",
            settings.SCHEDULER_MAX_CONCURRENT,
        )

    async def shutdown(self) -> None:
        """Gracefully stop all jobs and the scheduler."""
        if self._scheduler is None:
            return

        self._scheduler.shutdown(wait=False)
        self._scheduler = None
        self._started_at = None
        logger.info("Scheduler stopped")

    # ── properties ───────────────────────────────────────────────────

    @property
    def is_running(self) -> bool:
        return self._scheduler is not None and self._scheduler.running

    @property
    def scheduler(self) -> AsyncIOScheduler | None:
        return self._scheduler

    # ── job management ───────────────────────────────────────────────

    async def sync_jobs(self) -> dict[str, Any]:
        """
        Synchronise scheduled jobs to the current set of endpoints.

        Reads all endpoints from the database, then:
          - Adds new jobs for endpoints without a scheduled job.
          - Updates interval for endpoints whose interval changed.
          - Removes jobs for endpoints that no longer exist.

        Returns a summary dict for logging / API response.
        """
        if self._scheduler is None:
            logger.warning("sync_jobs called but scheduler is not running")
            return {"status": "scheduler_disabled", "synced": 0}

        # Import here to avoid circular imports at module level
        from app.db.session import async_session_factory
        from app.repositories.api_endpoint import ApiEndpointRepository

        async with async_session_factory() as session:
            repo = ApiEndpointRepository(session)
            endpoints = await repo.get_all()

        # Build lookup of desired jobs
        desired: dict[str, int] = {}  # job_id → interval_seconds
        endpoint_map: dict[str, Any] = {}  # job_id → endpoint
        for ep in endpoints:
            job_id = f"monitor_{ep.id}"
            desired[job_id] = ep.monitoring_interval_seconds
            endpoint_map[job_id] = ep

        # Current jobs in scheduler
        existing_ids = {job.id for job in self._scheduler.get_jobs()}

        added = 0
        updated = 0
        removed = 0

        # Remove jobs for deleted endpoints
        for job_id in existing_ids:
            if job_id not in desired:
                self._scheduler.remove_job(job_id)
                removed += 1
                logger.info("Removed job %s (endpoint deleted)", job_id)

        # Add or update jobs
        from app.scheduler.jobs import run_endpoint  # local import

        for job_id, interval in desired.items():
            ep = endpoint_map[job_id]

            if job_id in existing_ids:
                # Check if interval changed
                existing_job = self._scheduler.get_job(job_id)
                if existing_job is not None:
                    current_interval = existing_job.trigger.interval.total_seconds()
                    if int(current_interval) != interval:
                        self._scheduler.reschedule_job(
                            job_id,
                            trigger="interval",
                            seconds=interval,
                        )
                        updated += 1
                        logger.info(
                            "Updated job %s: interval %ds → %ds",
                            job_id, int(current_interval), interval,
                        )
            else:
                # New endpoint → add job
                self._scheduler.add_job(
                    run_endpoint,
                    trigger="interval",
                    seconds=interval,
                    id=job_id,
                    name=f"Monitor: {ep.name}",
                    kwargs={"endpoint_id": str(ep.id)},
                    replace_existing=True,
                )
                added += 1
                logger.info(
                    "Added job %s (%s every %ds)",
                    job_id, ep.name, interval,
                )

        summary = {
            "status": "synced",
            "total_jobs": len(desired),
            "added": added,
            "updated": updated,
            "removed": removed,
        }
        logger.info("Job sync complete: %s", summary)
        return summary

    def get_status(self) -> dict[str, Any]:
        """Return scheduler status for the API."""
        if self._scheduler is None:
            return {
                "running": False,
                "enabled": settings.SCHEDULER_ENABLED,
                "job_count": 0,
                "jobs": [],
            }

        jobs = []
        for job in self._scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "interval_seconds": int(job.trigger.interval.total_seconds()),
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            })

        return {
            "running": self._scheduler.running,
            "enabled": settings.SCHEDULER_ENABLED,
            "started_at": self._started_at.isoformat() if self._started_at else None,
            "job_count": len(jobs),
            "jobs": jobs,
        }


# ─── module-level singleton ─────────────────────────────────────────────

monitor_scheduler = MonitorScheduler()
