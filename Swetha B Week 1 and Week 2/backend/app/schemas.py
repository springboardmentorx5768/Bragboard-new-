# backend/app/schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from .models import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    joined_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: int
    exp: int

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None


class ShoutOutRecipientOut(BaseModel):
    recipient: UserOut

    class Config:
        from_attributes = True

class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: list[int]

class ShoutOutOut(BaseModel):
    id: int
    sender: UserOut
    message: str
    created_at: datetime
    recipients: list[ShoutOutRecipientOut] = []

    class Config:
        from_attributes = True

