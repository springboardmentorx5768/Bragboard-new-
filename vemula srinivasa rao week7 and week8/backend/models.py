# models.py - Corrected version
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class ReactionType(enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    department_id = Column(Integer, ForeignKey("departments.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    department = relationship("Department", back_populates="users")
    shoutouts_sent = relationship("Shoutout", back_populates="sender", foreign_keys="Shoutout.sender_id")
    shoutouts_received = relationship("ShoutoutRecipient", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    reports_made = relationship("Report", back_populates="reporter")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users = relationship("User", back_populates="department")
    shoutouts = relationship("Shoutout", secondary="users", primaryjoin="User.department_id == Department.id", 
                           secondaryjoin="Shoutout.sender_id == User.id", viewonly=True)

class Shoutout(Base):
    __tablename__ = "shoutouts"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sender = relationship("User", back_populates="shoutouts_sent", foreign_keys=[sender_id])
    recipients = relationship("ShoutoutRecipient", back_populates="shoutout")
    reactions = relationship("Reaction", back_populates="shoutout")
    comments = relationship("Comment", back_populates="shoutout")
    reports = relationship("Report", back_populates="shoutout")

class ShoutoutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    shoutout = relationship("Shoutout", back_populates="recipients")
    user = relationship("User", back_populates="shoutouts_received")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    reaction_type = Column(Enum(ReactionType))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    shoutout = relationship("Shoutout", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    is_edited = Column(Integer, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="comments")
    shoutout = relationship("Shoutout", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, resolved, dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    shoutout = relationship("Shoutout", back_populates="reports")
    reporter = relationship("User", back_populates="reports_made") 