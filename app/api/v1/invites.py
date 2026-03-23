import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId, require_role
from app.core.config import settings
from app.db.session import get_session
from app.models.user import UserRole
from app.repositories.auth import AuthRepository
from app.repositories.invite import InviteRepository
from app.schemas.invite import CreateInviteRequest, InviteListItem, InviteResponse

router = APIRouter(prefix="/invites", tags=["invites"])


def _get_invite_repo(
    session: AsyncSession = Depends(get_session),
) -> InviteRepository:
    return InviteRepository(session)


def _get_auth_repo(
    session: AsyncSession = Depends(get_session),
) -> AuthRepository:
    return AuthRepository(session)


@router.post(
    "/",
    response_model=InviteResponse,
    status_code=201,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def create_invite(
    body: CreateInviteRequest,
    user: CurrentUser,
    tenant_id: TenantId,
    invite_repo: InviteRepository = Depends(_get_invite_repo),
    auth_repo: AuthRepository = Depends(_get_auth_repo),
):
    """Create an invite for a new team member (OWNER or ADMIN only)."""
    if body.role == UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot invite with OWNER role",
        )

    # Check if email is already a member
    existing_user = await auth_repo.get_user_by_email_and_org(body.email, tenant_id)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email is already a member of the organization",
        )

    # Check for pending invite
    pending = await invite_repo.get_pending_by_email_and_org(body.email, tenant_id)
    if pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending invite already exists for this email",
        )

    invite = await invite_repo.create(
        org_id=tenant_id,
        email=body.email,
        role=body.role,
        invited_by=user.id,
    )

    invite_url = f"{settings.FRONTEND_ORIGIN}/join/{invite.token}"

    return InviteResponse(
        id=str(invite.id),
        email=invite.email,
        role=invite.role.value if hasattr(invite.role, "value") else str(invite.role),
        token=invite.token,
        invite_url=invite_url,
        expires_at=invite.expires_at.isoformat(),
        created_at=invite.created_at.isoformat(),
    )


@router.get(
    "/",
    response_model=list[InviteListItem],
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def list_pending_invites(
    tenant_id: TenantId,
    invite_repo: InviteRepository = Depends(_get_invite_repo),
):
    """List all pending invites for the organization (OWNER or ADMIN only)."""
    invites = await invite_repo.get_pending_by_org(tenant_id)
    return [
        InviteListItem(
            id=str(inv.id),
            email=inv.email,
            role=inv.role.value if hasattr(inv.role, "value") else str(inv.role),
            expires_at=inv.expires_at.isoformat(),
            created_at=inv.created_at.isoformat(),
        )
        for inv in invites
    ]


@router.delete(
    "/{invite_id}",
    status_code=204,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def revoke_invite(
    invite_id: str,
    tenant_id: TenantId,
    invite_repo: InviteRepository = Depends(_get_invite_repo),
):
    """Revoke a pending invite (OWNER or ADMIN only)."""
    invite_uuid = uuid.UUID(invite_id)
    # Verify invite belongs to this org by checking pending list
    pending = await invite_repo.get_pending_by_org(tenant_id)
    if not any(inv.id == invite_uuid for inv in pending):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found",
        )
    await invite_repo.delete(invite_uuid)
