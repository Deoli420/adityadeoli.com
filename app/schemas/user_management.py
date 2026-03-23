from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class SignupRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    org_name: str | None = None


class JoinRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangeRoleRequest(BaseModel):
    role: UserRole


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str
    member_count: int
    created_at: str

    model_config = {"from_attributes": True}


class OrgUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(
        None,
        min_length=1,
        max_length=63,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


class TransferOwnershipRequest(BaseModel):
    new_owner_id: str
