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
    reactions = relationship("Reaction", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    reports_sent = relationship("Report", back_populates="reporter")

class Shoutout(Base):
    __tablename__ = "shoutouts"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    image_url = Column(String, nullable=True) 
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())

    sender = relationship("User", back_populates="shoutouts_sent")
    recipients = relationship("ShoutoutRecipient", back_populates="shoutout", cascade="all, delete")
    reactions = relationship("Reaction", back_populates="shoutout", cascade="all, delete")
    comments = relationship("Comment", back_populates="shoutout", cascade="all, delete")
    reports = relationship("Report", back_populates="shoutout", cascade="all, delete")

class ShoutoutRecipient(Base):
    __tablename__ = "shoutout_recipients"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    is_seen = Column(Boolean, default=False) 

    shoutout = relationship("Shoutout", back_populates="recipients")
    recipient = relationship("User", back_populates="shoutouts_received")

class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String, nullable=False)

    shoutout = relationship("Shoutout", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())

    shoutout = relationship("Shoutout", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=func.now())

    shoutout = relationship("Shoutout", back_populates="reports")
    reporter = relationship("User", back_populates="reports_sent")