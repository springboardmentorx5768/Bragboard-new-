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

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None
    
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

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    
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
