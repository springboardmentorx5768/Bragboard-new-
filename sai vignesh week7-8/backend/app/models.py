from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, Boolean
from sqlalchemy.orm import relationship, backref
import datetime
import enum
from .database import Base 

class UserRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"
    STAFF = "STAFF"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    department = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    shoutouts_sent = relationship("ShoutOut", back_populates="sender")

class ShoutOut(Base):
    __tablename__ = "shoutouts"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    image_url = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sender = relationship("User", back_populates="shoutouts_sent")
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout")
    reactions = relationship("Reaction", back_populates="shoutout", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="shoutout", cascade="all, delete-orphan")
    
    is_reported = Column(Boolean, default=False)
    report_reason = Column(String, nullable=True)

class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User")

class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    reaction_type = Column(String)  
    shoutout = relationship("ShoutOut", back_populates="reactions")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True) 
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User")
    shoutout = relationship("ShoutOut", back_populates="comments")
    replies = relationship("Comment", backref=backref("parent", remote_side=[id]))