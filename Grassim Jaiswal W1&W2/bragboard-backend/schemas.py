from pydantic import BaseModel, EmailStr
from typing import Optional

# 1. Base Schema (Shared properties)
class UserBase(BaseModel):
    email: EmailStr
    department: Optional[str] = None
    role: str = "employee"

# 2. Schema for CREATING a user (Includes password)
class UserCreate(UserBase):
    name: str
    password: str

# 3. Schema for RETURNING a user (Hides password)
class UserOut(UserBase):
    id: int
    name: str
    
    class Config:
        from_attributes = True
        
# 4. Schema for LOGIN (What the user sends)
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 5. Schema for TOKEN (What we send back)
class Token(BaseModel):
    access_token: str
    token_type: str