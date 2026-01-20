from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "employee"
    department_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    department_id: Optional[int]
    department_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Department schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentResponse(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True

# Shoutout schemas
class ShoutoutBase(BaseModel):
    message: str
    recipient_ids: List[int]
    image_url: Optional[str] = None

class ShoutoutCreate(ShoutoutBase):
    pass

class RecipientInfo(BaseModel):
    id: int
    username: str
    department_id: Optional[int]

class ShoutoutResponse(BaseModel):
    id: int
    message: str
    sender_id: int
    sender_name: str
    image_url: Optional[str]
    created_at: datetime
    recipients: List[RecipientInfo]
    reaction_counts: dict
    user_reactions: List[dict]
    
    class Config:
        from_attributes = True

# Reaction schemas
class ReactionCreate(BaseModel):
    reaction_type: str

class ReactionResponse(BaseModel):
    id: int
    shoutout_id: int
    user_id: int
    reaction_type: str
    created_at: datetime