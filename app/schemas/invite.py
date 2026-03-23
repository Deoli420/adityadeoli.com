from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class CreateInviteRequest(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER


class InviteResponse(BaseModel):
    id: str
    email: str
    role: str
    token: str
    invite_url: str
    expires_at: str
    created_at: str


class InviteListItem(BaseModel):
    id: str
    email: str
    role: str
    expires_at: str
    created_at: str


class ValidateInviteResponse(BaseModel):
    valid: bool
    email: str | None = None
    org_name: str | None = None
    role: str | None = None
    expires_at: str | None = None
