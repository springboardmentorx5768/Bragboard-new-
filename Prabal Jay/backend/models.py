from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, default='employee', nullable=False)
    joined_at = Column(TIMESTAMP(timezone=True), default=func.now(), nullable=False)

    shoutouts_sent = relationship("Shoutout", back_populates="sender")
    shoutouts_received = relationship("ShoutoutRecipient", back_populates="recipient")

class Shoutout(Base):
    __tablename__ = "shoutouts"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    image_url = Column(String, nullable=True) 
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())

    sender = relationship("User", back_populates="shoutouts_sent")
    recipients = relationship("ShoutoutRecipient", back_populates="shoutout", cascade="all, delete")

class ShoutoutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    is_seen = Column(Boolean, default=False) 

    shoutout = relationship("Shoutout", back_populates="recipients")
    recipient = relationship("User", back_populates="shoutouts_received")