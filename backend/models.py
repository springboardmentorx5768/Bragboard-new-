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

class Brag(Base):
    __tablename__ = "brags"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)  # Base64 encoded image data
    tags = Column(String, nullable=True)  # Comma-separated tags
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    department = relationship("Department", back_populates="brags")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="brags")
    

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    @property
    def author_name(self):
        return self.user.name if self.user else "Unknown"



