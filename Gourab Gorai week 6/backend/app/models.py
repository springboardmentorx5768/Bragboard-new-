from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
import datetime
import enum
from .database import Base

class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"

class ReactionType(str, enum.Enum):
    LIKE = "like"
    CLAP = "clap"
    STAR = "star"

class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    department = Column(String)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_deleted = Column(String, default="false") # "true", "false"
    profile_picture = Column(String, nullable=True)

    shoutouts_sent = relationship("ShoutOut", back_populates="sender")
    comments = relationship("Comment", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    reports_filed = relationship("Report", back_populates="reporter")
    admin_logs = relationship("AdminLog", back_populates="admin")
    notifications_received = relationship("Notification", foreign_keys="[Notification.recipient_id]", back_populates="recipient")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    type = Column(String)  # "tag", "reaction_like", "reaction_clap", "reaction_star", "comment"
    message = Column(Text)
    is_read = Column(String, default="false") # "true", "false"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications_received")
    sender = relationship("User", foreign_keys=[sender_id])
    shoutout = relationship("ShoutOut")
    comment = relationship("Comment")

class ShoutOut(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sender = relationship("User", back_populates="shoutouts_sent")
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout")
    comments = relationship("Comment", back_populates="shoutout")
    reactions = relationship("Reaction", back_populates="shoutout")
    reports = relationship("Report", back_populates="reports_shoutout")
    media = relationship("ShoutOutMedia", back_populates="shoutout")

class ShoutOutMedia(Base):
    __tablename__ = "shoutout_media"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    file_path = Column(String)
    media_type = Column(Enum(MediaType))

    shoutout = relationship("ShoutOut", back_populates="media")

class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))

    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shoutout = relationship("ShoutOut", back_populates="comments")
    user = relationship("User", back_populates="comments")
    reports = relationship("Report", back_populates="comment")

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(Enum(ReactionType))

    shoutout = relationship("ShoutOut", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    reported_by = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_resolved = Column(String, default="false") # "false", "deleted", "ignored"

    reports_shoutout = relationship("ShoutOut", back_populates="reports")
    comment = relationship("Comment", back_populates="reports")
    reporter = relationship("User", back_populates="reports_filed")

class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action = Column(Text)
    target_id = Column(Integer)
    target_type = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    admin = relationship("User", back_populates="admin_logs")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)  # We will store "true"/"false" strings for booleans
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
