"""
FastAPI dependency functions for authentication and authorization.

Usage in route handlers:
    from app.core.auth import CurrentUser, TenantId, require_role
    from app.models.user import UserRole

    @router.get("/")
    async def list_items(user: CurrentUser, tenant_id: TenantId): ...

    @router.delete("/{id}", dependencies=[Depends(require_role(UserRole.ADMIN))])
    async def delete_item(...): ...
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.user import User, UserRole
from app.repositories.auth import AuthRepository
from app.services.auth import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Extract and validate the current user from the JWT access token."""
    repo = AuthRepository(session)
    service = AuthService(repo)
    return await service.verify_and_get_user(token)


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory — returns a dependency that checks the user's role.

    Usage:
        @router.post("/", dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.MEMBER))])
    """

    async def _check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _check_role


async def get_tenant_id(user: User = Depends(get_current_user)) -> uuid.UUID:
    """Extract the organization_id (tenant) from the current user."""
    return user.organization_id


# ── Type aliases for cleaner route signatures ────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
TenantId = Annotated[uuid.UUID, Depends(get_tenant_id)]
