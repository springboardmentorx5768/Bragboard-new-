from datetime import datetime
from typing import Optional, List
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

class ShoutOutBase(BaseModel):
    message: str

class ShoutOutOut(ShoutOutBase):
    id: int
    sender_id: int
    sender_name: str 
    target_dept: str
    image_url: Optional[str] = None 
    created_at: datetime
    class Config:
        from_attributes = True