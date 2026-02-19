from typing import Any

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, require_role
from app.models.user import UserRole
from app.scheduler.engine import monitor_scheduler

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get(
    "/status",
    summary="Get scheduler status and active jobs",
)
async def get_status(
    user: CurrentUser,
) -> dict[str, Any]:
    """
    Return the current scheduler state, including whether it's running,
    the number of active jobs, and each job's next scheduled run time.
    """
    return monitor_scheduler.get_status()


@router.post(
    "/sync",
    status_code=200,
    summary="Sync scheduled jobs to current endpoints",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def sync_jobs() -> dict[str, Any]:
    """
    Re-read all endpoints from the database and synchronise the
    scheduler's job list.

    - Adds jobs for new endpoints.
    - Updates intervals for changed endpoints.
    - Removes jobs for deleted endpoints.

    Call this after creating, updating, or deleting endpoints
    to reflect changes immediately (otherwise they take effect
    on the next app restart).
    """
    return await monitor_scheduler.sync_jobs()
