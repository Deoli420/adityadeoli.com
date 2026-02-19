from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_session
from app.repositories.auth import AuthRepository
from app.schemas.auth import LoginRequest, TokenResponse, UserRead
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _get_service(session: AsyncSession = Depends(get_session)) -> AuthService:
    return AuthService(AuthRepository(session))


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Set httpOnly refresh token cookie."""
    is_prod = settings.FRONTEND_ORIGIN.startswith("https")
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_token,
        httponly=True,
        secure=is_prod,
        samesite="strict" if is_prod else "lax",
        path=REFRESH_COOKIE_PATH,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie."""
    is_prod = settings.FRONTEND_ORIGIN.startswith("https")
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=is_prod,
        samesite="strict" if is_prod else "lax",
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    service: AuthService = Depends(_get_service),
):
    """
    Authenticate with email + password + organization slug.

    Returns access_token in JSON and refresh_token as httpOnly cookie.
    """
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    access_token, raw_refresh, user = await service.login(
        email=body.email,
        password=body.password,
        org_slug=body.organization_slug,
        ip_address=ip,
        user_agent=ua,
    )

    _set_refresh_cookie(response, raw_refresh)

    return TokenResponse(
        access_token=access_token,
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE),
    service: AuthService = Depends(_get_service),
):
    """
    Rotate refresh token and issue new access token.

    Reads the refresh_token from the httpOnly cookie.
    """
    if not refresh_token:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    new_access, new_raw_refresh, user = await service.refresh(
        raw_refresh_token=refresh_token,
        ip_address=ip,
        user_agent=ua,
    )

    _set_refresh_cookie(response, new_raw_refresh)

    return TokenResponse(
        access_token=new_access,
        user=UserRead.model_validate(user),
    )


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    user: CurrentUser,
    refresh_token: str | None = Cookie(None, alias=REFRESH_COOKIE),
    service: AuthService = Depends(_get_service),
):
    """Revoke refresh token, clear cookie, invalidate session."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    await service.logout(
        raw_refresh_token=refresh_token,
        user=user,
        ip_address=ip,
        user_agent=ua,
    )

    _clear_refresh_cookie(response)


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser):
    """Return the currently authenticated user."""
    return UserRead.model_validate(user)
