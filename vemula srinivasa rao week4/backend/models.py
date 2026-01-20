from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="users")
    sent_shoutouts = relationship("Shoutout", back_populates="sender", foreign_keys="Shoutout.sender_id")
    received_shoutouts = relationship("ShoutoutRecipient", back_populates="user")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    users = relationship("User", back_populates="department")

class Shoutout(Base):
    __tablename__ = "shoutouts"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text)
    sender_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship("User", back_populates="sent_shoutouts", foreign_keys=[sender_id])
    recipients = relationship("ShoutoutRecipient", back_populates="shoutout")

class ShoutoutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    shoutout = relationship("Shoutout", back_populates="recipients")
    user = relationship("User", back_populates="received_shoutouts")