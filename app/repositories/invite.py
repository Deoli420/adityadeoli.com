import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.invite import Invite
from app.models.user import UserRole


class InviteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        org_id: uuid.UUID,
        email: str,
        role: UserRole,
        invited_by: uuid.UUID,
    ) -> Invite:
        invite = Invite(
            organization_id=org_id,
            email=email,
            role=role,
            invited_by=invited_by,
        )
        self._session.add(invite)
        await self._session.flush()
        return invite

    async def get_by_token(self, token: str) -> Optional[Invite]:
        result = await self._session.execute(
            select(Invite)
            .options(joinedload(Invite.organization))
            .where(Invite.token == token)
        )
        return result.scalar_one_or_none()

    async def get_pending_by_org(self, org_id: uuid.UUID) -> list[Invite]:
        result = await self._session.execute(
            select(Invite).where(
                Invite.organization_id == org_id,
                Invite.used_at.is_(None),
                Invite.expires_at > datetime.now(timezone.utc),
            )
        )
        return list(result.scalars().all())

    async def get_pending_by_email_and_org(
        self, email: str, org_id: uuid.UUID
    ) -> Optional[Invite]:
        result = await self._session.execute(
            select(Invite).where(
                Invite.organization_id == org_id,
                Invite.email == email,
                Invite.used_at.is_(None),
                Invite.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, invite_id: uuid.UUID) -> None:
        await self._session.execute(
            update(Invite)
            .where(Invite.id == invite_id)
            .values(used_at=datetime.now(timezone.utc))
        )

    async def delete(self, invite_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(Invite).where(Invite.id == invite_id)
        )
