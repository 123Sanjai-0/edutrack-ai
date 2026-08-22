from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[UserRole] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
