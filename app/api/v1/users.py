import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId, require_role
from app.db.session import get_session
from app.models.user import UserRole
from app.repositories.auth import AuthRepository
from app.schemas.user_management import (
    ChangePasswordRequest,
    ChangeRoleRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/users", tags=["users"])


def _get_repo(session: AsyncSession = Depends(get_session)) -> AuthRepository:
    return AuthRepository(session)


def _get_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(AuthRepository(session))


def _user_to_response(user) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(user: CurrentUser):
    """Return the current user's profile."""
    return _user_to_response(user)


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    body: UpdateProfileRequest,
    user: CurrentUser,
    repo: AuthRepository = Depends(_get_repo),
):
    """Update the current user's display name or email."""
    updates = {}
    if body.display_name is not None:
        updates["display_name"] = body.display_name
    if body.email is not None:
        updates["email"] = body.email

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    await repo.update_user(user.id, **updates)
    updated = await repo.get_user_by_id(user.id)
    return _user_to_response(updated)


@router.patch("/me/password", status_code=204)
async def change_my_password(
    body: ChangePasswordRequest,
    user: CurrentUser,
    repo: AuthRepository = Depends(_get_repo),
    service: AuthService = Depends(_get_service),
):
    """Change the current user's password."""
    if not service.verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    new_hash = service.hash_password(body.new_password)
    await repo.update_user(user.id, password_hash=new_hash)
    await repo.increment_token_version(user.id)


@router.get("/", response_model=list[UserResponse])
async def list_users(
    user: CurrentUser,
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """List all members of the current organization."""
    users = await repo.get_users_by_org(tenant_id)
    return [_user_to_response(u) for u in users]


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def change_user_role(
    user_id: str,
    body: ChangeRoleRequest,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """Change a user's role (OWNER or ADMIN only)."""
    target_id = uuid.UUID(user_id)

    if target_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    if body.role == UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set role to OWNER. Use the transfer ownership endpoint.",
        )

    target = await repo.get_user_by_id_and_org(target_id, tenant_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target.role == UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the owner's role",
        )

    await repo.update_user(target_id, role=body.role)
    updated = await repo.get_user_by_id_and_org(target_id, tenant_id)
    return _user_to_response(updated)


@router.delete(
    "/{user_id}",
    status_code=204,
    dependencies=[Depends(require_role(UserRole.OWNER, UserRole.ADMIN))],
)
async def deactivate_user(
    user_id: str,
    user: CurrentUser,
    tenant_id: TenantId,
    repo: AuthRepository = Depends(_get_repo),
):
    """Deactivate a user (OWNER or ADMIN only)."""
    target_id = uuid.UUID(user_id)

    if target_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself",
        )

    target = await repo.get_user_by_id_and_org(target_id, tenant_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target.role == UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the owner",
        )

    await repo.update_user(target_id, is_active=False)
