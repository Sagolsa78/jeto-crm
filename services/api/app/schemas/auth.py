from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, computed_field
from ..models.user import UserRole
from ..rbac import get_user_permissions


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    team_id: Optional[str] = None

    @computed_field
    def permissions(self) -> List[str]:
        return get_user_permissions(self.role)


TokenResponse.model_rebuild()
