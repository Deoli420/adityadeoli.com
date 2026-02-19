import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.audit_log import AuditLog
from app.models.organization import Organization
from app.models.refresh_token import RefreshToken
from app.models.user import User


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Organization ────────────────────────────────────────────────────

    async def get_org_by_slug(self, slug: str) -> Optional[Organization]:
        result = await self._session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()

    # ── User ────────────────────────────────────────────────────────────

    async def get_user_by_email_and_org(
        self, email: str, org_id: uuid.UUID
    ) -> Optional[User]:
        result = await self._session.execute(
            select(User)
            .options(joinedload(User.organization))
            .where(User.email == email, User.organization_id == org_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self._session.execute(
            select(User)
            .options(joinedload(User.organization))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def increment_failed_attempts(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(failed_login_attempts=User.failed_login_attempts + 1)
        )

    async def reset_failed_attempts(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(failed_login_attempts=0, locked_until=None)
        )

    async def lock_user(self, user_id: uuid.UUID, until: datetime) -> None:
        await self._session.execute(
            update(User).where(User.id == user_id).values(locked_until=until)
        )

    # ── Refresh Tokens ──────────────────────────────────────────────────

    async def create_refresh_token(
        self,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def get_refresh_token_by_hash(
        self, token_hash: str
    ) -> Optional[RefreshToken]:
        result = await self._session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token_id: uuid.UUID) -> None:
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(is_revoked=True)
        )

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        await self._session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked.is_(False),
            )
            .values(is_revoked=True)
        )

    # ── Audit Log ───────────────────────────────────────────────────────

    async def create_audit_log(
        self,
        action: str,
        *,
        organization_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> AuditLog:
        log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            detail=detail,
        )
        self._session.add(log)
        await self._session.flush()
        return log
