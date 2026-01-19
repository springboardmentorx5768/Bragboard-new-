from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, EmailStr
from .models import UserRole 

class UserBase(BaseModel):
    name: str
    email: EmailStr
    department: str
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
    user_name: str
    department: str
    role: str
class CommentOut(BaseModel):
    id: int
    content: str
    user_name: str
    parent_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ShoutOutBase(BaseModel):
    message: str

class ShoutOutOut(ShoutOutBase):
    id: int
    sender_id: int
    sender_name: str 
    target_dept: str
    image_url: Optional[str] = None 
    created_at: datetime
    reaction_counts: Dict[str, int]
    comments: List[CommentOut] = [] 

    class Config:
        from_attributes = True