from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, ReactionType

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        orm_mode = True

# User Schemas
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    user_id: Optional[str] = None
    department: Optional[DepartmentResponse] = None
    role: UserRole
    joined_at: datetime
    
    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department_id: Optional[int] = None
    role: UserRole = UserRole.employee

class UserLogin(BaseModel):
    email: str  # Can be email or user_id
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None

# ShoutOut Schemas
class ReactionBase(BaseModel):
    type: ReactionType

# Notification Schemas
class NotificationBase(BaseModel):
    recipient_id: int
    actor_id: int
    type: str
    message: str
    reference_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    is_read: str
    created_at: datetime
    actor: Optional[UserResponse] = None

    class Config:
        orm_mode = True

class ShoutOutBase(BaseModel):
    message: str
    title: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None

class ShoutOutCreate(ShoutOutBase):
    recipient_ids: List[int]

class ShoutOutRecipientResponse(BaseModel):
    id: int
    recipient: UserResponse
    viewed: Optional[str] = 'false'

    class Config:
        orm_mode = True

class ShoutOutResponse(ShoutOutBase):
    id: int
    sender_id: int
    sender: Optional[UserResponse] = None
    recipients: List[ShoutOutRecipientResponse] = []
    created_at: datetime
    reaction_counts: dict = {}
    current_user_reactions: List[ReactionType] = []

    class Config:
        orm_mode = True

# Comment Schemas
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    shoutout_id: int

class CommentResponse(CommentBase):
    id: int
    shoutout_id: int
    user_id: int
    user: Optional[UserResponse] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Reaction Schemas
class ReactionBase(BaseModel):
    type: ReactionType

class ReactionCreate(ReactionBase):
    shoutout_id: int

class ReactionResponse(ReactionBase):
    id: int
    shoutout_id: int
    user_id: int

    class Config:
        orm_mode = True

# Report Schemas
class ReportBase(BaseModel):
    reason: str

class ReportCreate(ReportBase):
    shoutout_id: int

class ReportResponse(ReportBase):
    id: int
    shoutout_id: int
    reported_by: int
    created_at: datetime

    class Config:
        orm_mode = True

# AdminLog Schemas
class AdminLogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    target_id: Optional[int]
    target_type: Optional[str]
    timestamp: datetime

    class Config:
        orm_mode = True
