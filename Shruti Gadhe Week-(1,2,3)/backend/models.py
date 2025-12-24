from sqlalchemy import Column, Integer, String, Text, Enum, TIMESTAMP, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Define User Roles as per schema [cite: 95]
class UserRole(str, enum.Enum):
    employee = "employee"
    admin = "admin"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

    users = relationship("User", back_populates="department")
    brags = relationship("Brag", back_populates="department")

class User(Base):
    __tablename__ = "users"

    #Users Table variables
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="users")
    
    role = Column(Enum(UserRole), default=UserRole.employee)
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    brags = relationship("Brag", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Brag(Base):
    __tablename__ = "brags"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)  # Base64 encoded image data
    video_url = Column(Text, nullable=True)  # Base64 encoded video data
    tags = Column(String, nullable=True)  # Comma-separated tags
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    department = relationship("Department", back_populates="brags")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="brags")
    

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    
    @property
    def author_name(self):
        return self.user.name if self.user else "Unknown"

# Association table for Shout-outs and Recipients
shoutout_recipients = Table(
    "shoutout_recipients",
    Base.metadata,
    Column("shoutout_id", Integer, ForeignKey("shoutouts.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
)

class Shoutout(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_username = Column(String, nullable=True)  # Denormalized sender username
    recipient_usernames = Column(Text, nullable=True)  # Comma-separated recipient usernames
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    recipients = relationship("User", secondary=shoutout_recipients)

    @property
    def sender_name(self):
        return self.sender.name if self.sender else "Unknown"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Integer, default=0) # 0 for unread, 1 for read (similar to boolean)
    type = Column(String, default="shoutout")
    source_id = Column(Integer, nullable=True) # e.g., shoutout_id
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
