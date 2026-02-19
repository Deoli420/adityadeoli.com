import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings
from app.models.user import User
from app.repositories.auth import AuthRepository


class AuthService:
    def __init__(self, repo: AuthRepository) -> None:
        self._repo = repo

    # ── Password Hashing ────────────────────────────────────────────────

    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    # ── Token Helpers ───────────────────────────────────────────────────

    @staticmethod
    def _hash_token(raw_token: str) -> str:
        """SHA-256 hash of a raw refresh token for DB storage."""
        return hashlib.sha256(raw_token.encode()).hexdigest()

    @staticmethod
    def create_access_token(user: User) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user.id),
            "org": str(user.organization_id),
            "role": user.role.value,
            "tv": user.token_version,
            "iat": now,
            "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_access_token(token: str) -> dict:
        """Decode and validate an access token. Raises on failure."""
        try:
            return jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e

    # ── Login ───────────────────────────────────────────────────────────

    async def login(
        self,
        email: str,
        password: str,
        org_slug: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, str, User]:
        """
        Authenticate user. Returns (access_token, raw_refresh_token, user).
        """
        # 1. Find organization
        org = await self._repo.get_org_by_slug(org_slug)
        if not org or not org.is_active:
            await self._repo.create_audit_log(
                "LOGIN_FAILED",
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"reason": "invalid_org", "slug": org_slug},
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # 2. Find user
        user = await self._repo.get_user_by_email_and_org(email, org.id)
        if not user or not user.is_active:
            await self._repo.create_audit_log(
                "LOGIN_FAILED",
                organization_id=org.id,
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"reason": "user_not_found", "email": email},
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # 3. Check lockout
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            await self._repo.create_audit_log(
                "LOGIN_FAILED",
                organization_id=org.id,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"reason": "account_locked"},
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account temporarily locked. Try again later.",
            )

        # 4. Verify password
        if not self.verify_password(password, user.password_hash):
            await self._repo.increment_failed_attempts(user.id)
            new_count = user.failed_login_attempts + 1

            if new_count >= settings.MAX_LOGIN_ATTEMPTS:
                lock_until = datetime.now(timezone.utc) + timedelta(
                    minutes=settings.LOCKOUT_MINUTES
                )
                await self._repo.lock_user(user.id, lock_until)

            await self._repo.create_audit_log(
                "LOGIN_FAILED",
                organization_id=org.id,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                detail={"reason": "wrong_password", "attempt": new_count},
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # 5. Success — reset attempts, issue tokens
        await self._repo.reset_failed_attempts(user.id)

        access_token = self.create_access_token(user)
        raw_refresh = str(uuid.uuid4())
        token_hash = self._hash_token(raw_refresh)
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        await self._repo.create_refresh_token(user.id, token_hash, expires_at)

        await self._repo.create_audit_log(
            "LOGIN_SUCCESS",
            organization_id=org.id,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return access_token, raw_refresh, user

    # ── Refresh ─────────────────────────────────────────────────────────

    async def refresh(
        self,
        raw_refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, str, User]:
        """
        Rotate refresh token. Returns (new_access_token, new_raw_refresh, user).
        """
        token_hash = self._hash_token(raw_refresh_token)
        stored = await self._repo.get_refresh_token_by_hash(token_hash)

        if not stored or stored.is_revoked:
            # Possible token theft — revoke all tokens for this user
            if stored:
                await self._repo.revoke_all_user_tokens(stored.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if stored.expires_at < datetime.now(timezone.utc):
            await self._repo.revoke_refresh_token(stored.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = await self._repo.get_user_by_id(stored.user_id)
        if not user or not user.is_active:
            await self._repo.revoke_all_user_tokens(stored.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account disabled",
            )

        if not user.organization or not user.organization.is_active:
            await self._repo.revoke_all_user_tokens(stored.user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Organization disabled",
            )

        # Rotate: revoke old, create new
        await self._repo.revoke_refresh_token(stored.id)

        new_access = self.create_access_token(user)
        new_raw_refresh = str(uuid.uuid4())
        new_hash = self._hash_token(new_raw_refresh)
        new_expires = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        await self._repo.create_refresh_token(user.id, new_hash, new_expires)

        await self._repo.create_audit_log(
            "TOKEN_REFRESH",
            organization_id=user.organization_id,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return new_access, new_raw_refresh, user

    # ── Logout ──────────────────────────────────────────────────────────

    async def logout(
        self,
        raw_refresh_token: str | None,
        user: User,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        if raw_refresh_token:
            token_hash = self._hash_token(raw_refresh_token)
            stored = await self._repo.get_refresh_token_by_hash(token_hash)
            if stored and not stored.is_revoked:
                await self._repo.revoke_refresh_token(stored.id)

        await self._repo.create_audit_log(
            "LOGOUT",
            organization_id=user.organization_id,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    # ── Verify Access Token (for middleware) ────────────────────────────

    async def verify_and_get_user(self, token: str) -> User:
        """Decode JWT, verify token_version, return User."""
        payload = self.decode_access_token(token)

        user_id = payload.get("sub")
        token_version = payload.get("tv")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await self._repo.get_user_by_id(uuid.UUID(user_id))

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.token_version != token_version:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user
