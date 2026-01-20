from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
import enum

# Enums
class ReactionType(str, enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "employee"
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    department_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Department Schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Shoutout Schemas
class ShoutoutBase(BaseModel):
    message: str
    recipient_ids: List[int] = []
    image_url: Optional[str] = None

class ShoutoutCreate(ShoutoutBase):
    pass

class ShoutoutResponse(BaseModel):
    id: int
    message: str
    sender_id: int
    sender_name: str
    image_url: Optional[str]
    created_at: datetime
    recipients: List[Dict[str, Any]]
    reaction_counts: Dict[str, int]
    user_reactions: List[Dict[str, Any]]
    
    model_config = ConfigDict(from_attributes=True)

# Reaction Schemas
class ReactionBase(BaseModel):
    reaction_type: ReactionType

class ReactionCreate(ReactionBase):
    pass

# Comment Schemas
class CommentBase(BaseModel):
    text: str
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(BaseModel):
    id: int
    text: str
    user_id: int
    username: str
    user_role: str
    parent_id: Optional[int]
    created_at: datetime
    is_edited: bool
    
    model_config = ConfigDict(from_attributes=True)

# Report Schemas
class ReportBase(BaseModel):
    shoutout_id: int
    reason: str
    description: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class ReportResponse(BaseModel):
    id: int
    shoutout_id: int
    reporter_id: int
    reason: str
    description: Optional[str]
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

# Admin Stats Schemas
class AdminStats(BaseModel):
    total_shoutouts: int
    total_reactions: int
    total_users: int
    total_departments: int
    top_contributors: List[Dict[str, Any]]
    most_tagged_users: List[Dict[str, Any]]
    recent_shoutouts: List[Dict[str, Any]]
    pending_reports: int

# Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    id: int
    username: str
    email: str
    department_name: Optional[str]
    shoutouts_received: int
    reactions_received: int
    points: int

# User Stats Schemas
class UserStats(BaseModel):
    shoutouts_sent: int
    shoutouts_received: int
    reactions_given: int
    reactions_received: int
    total_points: int

class UserStatsResponse(BaseModel):
    user_id: int
    username: str
    stats: UserStats
    recent_activity: List[Dict[str, Any]]

# Export Schemas
class ExportResponse(BaseModel):
    filename: str
    content: str
    content_type: str

# User Role Update Schema
class UserRoleUpdate(BaseModel):
    role: str 