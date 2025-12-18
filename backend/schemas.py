from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole

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
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department_id: Optional[int] = None
    role: UserRole = UserRole.employee

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: Optional[DepartmentResponse] = None
    role: UserRole
    joined_at: datetime
    
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None

# Brag Schemas
class BragBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    tags: Optional[str] = None

class BragCreate(BragBase):
    pass

class BragResponse(BragBase):
    id: int
    user_id: int
    department_id: int
    created_at: datetime
    author_name: str
    image_url: Optional[str] = None
    tags: Optional[str] = None

    class Config:
        orm_mode = True


