import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId, require_role
from app.db.session import get_session
from app.models.user import UserRole
from app.repositories.auth import AuthRepository
from app.schemas.user_management import OrgResponse, OrgUpdateRequest, TransferOwnershipRequest

router = APIRouter(prefix="/organization", tags=["organization"])


def _get_repo(session: AsyncSession = Depends(get_session)) -> AuthRepository:
    return AuthRepository(session)


@router.get(
    "/",
    response_model=OrgResponse,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def get_organization(
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """Get the current organization details with member count."""
    org = await repo.get_org_by_id(tenant_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    members = await repo.get_users_by_org(tenant_id)
    member_count = len([m for m in members if m.is_active])

    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        member_count=member_count,
        created_at=org.created_at.isoformat(),
    )


@router.patch(
    "/",
    response_model=OrgResponse,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def update_organization(
    body: OrgUpdateRequest,
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """Update organization name or slug (OWNER or ADMIN only)."""
    updates = {}

    if body.name is not None:
        updates["name"] = body.name

    if body.slug is not None:
        # Check slug uniqueness
        existing = await repo.get_org_by_slug(body.slug)
        if existing and existing.id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slug is already in use",
            )
        updates["slug"] = body.slug

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await repo.update_org(tenant_id, **updates)

    org = await repo.get_org_by_id(tenant_id)
    members = await repo.get_users_by_org(tenant_id)
    member_count = len([m for m in members if m.is_active])

    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        member_count=member_count,
        created_at=org.created_at.isoformat(),
    )


@router.post(
    "/transfer-ownership",
    status_code=204,
    dependencies=[Depends(require_role(UserRole.OWNER))],
)
async def transfer_ownership(
    body: TransferOwnershipRequest,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """Transfer organization ownership to another member (OWNER only)."""
    new_owner_id = uuid.UUID(body.new_owner_id)

    if new_owner_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer ownership to yourself",
        )

    new_owner = await repo.get_user_by_id_and_org(new_owner_id, tenant_id)
    if not new_owner or not new_owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this organization",
        )

    # Set new owner role to OWNER
    await repo.update_user(new_owner_id, role=UserRole.OWNER)
    # Set current owner role to ADMIN
    await repo.update_user(user.id, role=UserRole.ADMIN)

    # Audit log
    await repo.create_audit_log(
        "OWNERSHIP_TRANSFERRED",
        organization_id=tenant_id,
        user_id=user.id,
        detail={
            "new_owner_id": str(new_owner_id),
            "previous_owner_id": str(user.id),
        },
    )
