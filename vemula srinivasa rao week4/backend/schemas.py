from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "employee"
    department_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department_id: Optional[int]
    department_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ShoutoutCreate(BaseModel):
    message: str
    recipient_ids: list[int]
    image_url: Optional[str] = None

class ShoutoutResponse(BaseModel):
    id: int
    message: str
    sender_id: int
    sender_name: str
    image_url: Optional[str]
    created_at: datetime
    recipients: list[dict]

    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True