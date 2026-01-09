from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str
    role: Optional[str] = 'employee'

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: str
    role: str
    joined_at: datetime
    class Config: from_attributes = True

class ReactionResponse(BaseModel):
    user_id: int
    type: str
    class Config: from_attributes = True

class CommentResponse(BaseModel):
    id: int
    user: UserResponse
    content: str
    created_at: datetime
    class Config: from_attributes = True

class ShoutoutRecipientDetailResponse(BaseModel):
    recipient: UserResponse
    is_seen: bool
    class Config: from_attributes = True

class ShoutoutResponse(BaseModel):
    id: int
    sender: UserResponse
    message: str
    image_url: Optional[str] = None
    created_at: datetime
    recipients: List[ShoutoutRecipientDetailResponse] = []
    reactions: List[ReactionResponse] = [] 
    comments: List[CommentResponse] = []
    class Config: from_attributes = True

class UserProfileResponse(UserResponse):
    shoutouts_sent: List[ShoutoutResponse] = []
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ReactionCreate(BaseModel):
    type: str 

class CommentCreate(BaseModel):
    content: str