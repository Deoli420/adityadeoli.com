"""
Onboarding status endpoint.

Computes a checklist of first-time actions so the frontend can display
a guided onboarding experience on the dashboard.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.models.alert_rule import AlertRule
from app.models.api_endpoint import ApiEndpoint
from app.models.api_run import ApiRun
from app.models.endpoint_sla import EndpointSLA
from app.models.incident import Incident

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class OnboardingStep(BaseModel):
    key: str
    title: str
    description: str
    completed: bool
    link: str


class OnboardingStatus(BaseModel):
    completed_count: int
    total_count: int
    percent: int
    dismissed: bool
    steps: list[OnboardingStep]


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Return the onboarding checklist for the current tenant."""

    # Count entities
    endpoint_count: int = await session.scalar(
        select(func.count()).where(ApiEndpoint.organization_id == tenant_id)
    ) or 0

    run_count: int = await session.scalar(
        select(func.count()).where(ApiRun.organization_id == tenant_id)
    ) or 0

    sla_count: int = await session.scalar(
        select(func.count()).where(
            EndpointSLA.organization_id == tenant_id,
            EndpointSLA.is_active.is_(True),
        )
    ) or 0

    rule_count: int = await session.scalar(
        select(func.count()).where(
            AlertRule.organization_id == tenant_id,
            AlertRule.is_active.is_(True),
        )
    ) or 0

    incident_count: int = await session.scalar(
        select(func.count()).where(Incident.organization_id == tenant_id)
    ) or 0

    steps = [
        OnboardingStep(
            key="add_endpoint",
            title="Add your first endpoint",
            description="Start monitoring an API by adding its URL.",
            completed=endpoint_count > 0,
            link="/endpoints/new",
        ),
        OnboardingStep(
            key="first_run",
            title="Run your first monitor check",
            description="Trigger a probe to see status, latency, and risk.",
            completed=run_count > 0,
            link="/",
        ),
        OnboardingStep(
            key="configure_sla",
            title="Set an SLA target",
            description="Define uptime goals to track reliability.",
            completed=sla_count > 0,
            link="/",
        ),
        OnboardingStep(
            key="create_alert_rule",
            title="Create an alert rule",
            description="Get notified when something goes wrong.",
            completed=rule_count > 0,
            link="/",
        ),
        OnboardingStep(
            key="review_incidents",
            title="Review the Incidents page",
            description="See how incidents are tracked automatically.",
            completed=incident_count > 0,
            link="/incidents",
        ),
    ]

    completed_count = sum(1 for s in steps if s.completed)
    total = len(steps)
    percent = round(completed_count / total * 100) if total else 100

    return OnboardingStatus(
        completed_count=completed_count,
        total_count=total,
        percent=percent,
        dismissed=False,
        steps=steps,
    )
