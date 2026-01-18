# backend/app/schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from .models import UserRole

class UserBase(BaseModel):
    name: str
    email: EmailStr
    email: str
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel): # Modified to inherit from BaseModel directly as UserBase changed significantly
    id: int
    name: str
    email: str
    department: Optional[str] = None
    role: str
    joined_at: datetime
    profile_image_url: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    is_following: Optional[bool] = False # For the current user context

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
    recipient: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: list[int]

class ReactionOut(BaseModel):
    id: int
    type: str
    user_id: int

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class CommentOut(BaseModel):
    id: int
    user_id: int
    content: str
    created_at: datetime
    parent_id: Optional[int] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ShoutOutOut(BaseModel):
    id: int
    sender: Optional[UserOut] = None
    message: str
    image_url: Optional[str] = None
    edit_count: int = 0
    is_edited: int = 0
    created_at: datetime
    location: Optional[str] = None
    recipients: list[ShoutOutRecipientOut] = []
    reactions: list[ReactionOut] = []
    comments: list[CommentOut] = []

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: int
    actor_id: int
    shoutout_id: Optional[int] = None
    type: str
    message: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

class UserActivityOut(BaseModel):
    id: int
    user_id: int
    action: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ScreenTimeOut(BaseModel):
    id: int
    user_id: int
    date: datetime
    duration_seconds: int

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    reason: str

class ReportOut(BaseModel):
    id: int
    shoutout_id: Optional[int] = None
    comment_id: Optional[int] = None
    reported_by: int
    reason: str
    created_at: datetime
    reporter: Optional[UserOut] = None
    reports_shoutout: Optional[ShoutOutOut] = None
    comment: Optional[CommentOut] = None

    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    total_shoutouts: int
    top_sender: Optional[str]
    top_receiver: Optional[str]
    reports_count: int

class LeaderboardEntry(BaseModel):
    user: UserOut
    score: int
    rank: int

    class Config:
        from_attributes = True
