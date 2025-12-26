# backend/app/schemas.py
from datetime import datetime
from typing import Optional
import enum
from pydantic import BaseModel, EmailStr
from .models import UserRole, MediaType

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
    is_deleted: str
    profile_picture: Optional[str] = None

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

class UserRoleUpdate(BaseModel):
    role: UserRole


class ReactionType(str, enum.Enum):
    LIKE = "like"
    CLAP = "clap"
    STAR = "star"

class ReactionCreate(BaseModel):
    type: ReactionType

class ReactionOut(BaseModel):
    id: int
    user_id: int
    type: ReactionType
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    user: UserOut
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ShoutOutCreate(BaseModel):
    message: str
    recipient_ids: list[int]

class ShoutOutUpdate(BaseModel):
    message: str

class ShoutOutRecipientOut(BaseModel):
    recipient: UserOut

    class Config:
        from_attributes = True

class ShoutOutOut(BaseModel):
    id: int
    message: str
    created_at: datetime
    sender: UserOut
    recipients: list[ShoutOutRecipientOut] = []
    
    # New fields
    reactions: list[ReactionOut] = []
    comments: list[CommentOut] = []
    media: list["ShoutOutMediaOut"] = []

    class Config:
        from_attributes = True

class ShoutOutMediaOut(BaseModel):
    id: int
    file_path: str
    media_type: MediaType

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    reason: str
    shoutout_id: Optional[int] = None
    comment_id: Optional[int] = None

class ReportOut(BaseModel):
    id: int
    reason: str
    shoutout_id: Optional[int]
    comment_id: Optional[int]
    reported_by: int
    reporter: UserOut
    created_at: datetime
    is_resolved: str

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    sender: UserOut
    shoutout_id: Optional[int]
    comment_id: Optional[int]
    type: str # "tag", "reaction_like", "reaction_clap", "reaction_star", "comment"
    message: str
    is_read: str
    created_at: datetime

    class Config:
        from_attributes = True
