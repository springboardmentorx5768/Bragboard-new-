# app/schemas.py
from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum
from datetime import datetime

class Role(str, Enum):
    employee = "employee"
    admin = "admin"

class ReactionType(str, Enum):
    like = "like"
    clap = "clap"
    star = "star"

class ReportStatus(str, Enum):
    pending = "pending"
    resolved = "resolved"
    dismissed = "dismissed"

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None
    role: Optional[Role] = Role.employee
    
    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @field_validator('email')
    @classmethod
    def email_valid(cls, v):
        if not v or '@' not in v:
            raise ValueError('Invalid email address')
        return v.lower().strip()
    
    @field_validator('password')
    @classmethod
    def password_valid(cls, v):
        if not v:
            raise ValueError('Password cannot be empty')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 128:
            raise ValueError('Password must be less than 128 characters')
        return v

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    department: Optional[str]
    role: Role
    joined_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[Role] = None
    
    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v
    
    @field_validator('email')
    @classmethod
    def email_valid(cls, v):
        if v is not None and '@' not in v:
            raise ValueError('Invalid email address')
        return v.lower().strip() if v else v
    
    @field_validator('department')
    @classmethod
    def department_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Department cannot be empty')
        return v.strip() if v else v

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class BragCreate(BaseModel):
    content: str
    recipient_ids: list[int]
    
    @field_validator('content')
    @classmethod
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        if len(v) > 1000:
            raise ValueError('Content must be less than 1000 characters')
        return v.strip()

class AttachmentOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class BragOut(BaseModel):
    id: int
    content: str
    author: UserOut
    recipients: list[UserOut]
    attachments: list[AttachmentOut]
    reactions: list["ReactionOut"]
    comments: list["CommentOut"]
    created_at: datetime

    class Config:
        from_attributes = True

class ReactionCreate(BaseModel):
    reaction_type: ReactionType

class ReactionOut(BaseModel):
    id: int
    user: UserOut
    reaction_type: ReactionType
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    
    @field_validator('content')
    @classmethod
    def content_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Comment cannot be empty')
        if len(v) > 500:
            raise ValueError('Comment must be less than 500 characters')
        return v.strip()

class CommentOut(BaseModel):
    id: int
    user: UserOut
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    brag_id: Optional[int] = None
    reason: str
    description: Optional[str] = None
    
    @field_validator('reason')
    @classmethod
    def reason_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Reason cannot be empty')
        return v.strip()

class ReportUpdate(BaseModel):
    status: ReportStatus
    resolution_notes: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    brag_id: int
    reported_by: UserOut
    reason: str
    description: Optional[str]
    status: ReportStatus
    resolution_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    resolved_by: Optional[UserOut]

    class Config:
        from_attributes = True

class ReportDetailOut(BaseModel):
    id: int
    brag: BragOut
    reported_by: UserOut
    reason: str
    description: Optional[str]
    status: ReportStatus
    resolution_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    resolved_by: Optional[UserOut]

    class Config:
        from_attributes = True

# ================== LEADERBOARD ==================

class LeaderboardEntry(BaseModel):
    id: int
    user_id: int
    brags_sent: int
    appreciations_received: int
    reactions_given: int
    total_points: int
    last_updated: datetime

    class Config:
        from_attributes = True


class LeaderboardEntryWithUser(BaseModel):
    id: int
    user: UserOut
    brags_sent: int
    appreciations_received: int
    reactions_given: int
    total_points: int
    last_updated: datetime

    class Config:
        from_attributes = True


class LeaderboardStats(BaseModel):
    rank: int
    user_id: int
    name: str
    department: Optional[str]
    brags_sent: int
    appreciations_received: int
    reactions_given: int
    total_points: int
    last_updated: datetime

    class Config:
        from_attributes = True