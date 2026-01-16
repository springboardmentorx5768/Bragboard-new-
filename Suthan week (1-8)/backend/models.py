from sqlalchemy import Column, Integer, String, Text, Enum, TIMESTAMP, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship, backref
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


class User(Base):
    __tablename__ = "users"

    #Users Table variables
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    user_id = Column(String, unique=True, index=True, nullable=True)  # 4-digit unique ID
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="users")
    
    role = Column(Enum(UserRole), default=UserRole.employee)
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    



    




class ReactionType(str, enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"
    dislike = "dislike"

class ShoutOut(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    title = Column(String, nullable=True) # Added for Advanced Post
    image_url = Column(Text, nullable=True) # Added for Advanced Post
    tags = Column(String, nullable=True) # Added for Advanced Post
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="shoutout", cascade="all, delete-orphan")
    reactions = relationship("Reaction", back_populates="shoutout", cascade="all, delete-orphan")
    comment_reactions = relationship("CommentReaction", back_populates="shoutout", cascade="all, delete-orphan")

class ShoutOutRecipient(Base):
    __tablename__ = "shoutout_recipients"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    viewed = Column(String, default='false')  # Track if recipient has viewed the shout-out

    shoutout = relationship("ShoutOut", back_populates="recipients")
    recipient = relationship("User", foreign_keys=[recipient_id])

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    shoutout = relationship("ShoutOut", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id])
    parent = relationship("Comment", remote_side=[id], backref=backref("replies", cascade="all, delete-orphan"))
    reactions = relationship("CommentReaction", back_populates="comment", cascade="all, delete-orphan")

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ReactionType), nullable=False)

    shoutout = relationship("ShoutOut", back_populates="reactions")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint('user_id', 'shoutout_id', name='unique_user_shoutout_reaction'),
    )

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="Pending") # Pending, Resolved
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    shoutout = relationship("ShoutOut")
    reporter = relationship("User", foreign_keys=[reported_by])

class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Text, nullable=False)
    target_id = Column(Integer, nullable=True)
    target_type = Column(String, nullable=True)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now())

    admin = relationship("User", foreign_keys=[admin_id])

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # 'reaction', 'shoutout'
    message = Column(Text, nullable=False)
    reference_id = Column(Integer, nullable=True) # ID of the related object (e.g. shoutout_id)
    is_read = Column(String, default='false') # Using String 'true'/'false' to match other boolean-like fields in this legacy DB style
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    recipient = relationship("User", foreign_keys=[recipient_id])
    actor = relationship("User", foreign_keys=[actor_id])

class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=False)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(ReactionType), nullable=False) # Reuse ReactionType (like, clap, star) but user asked for like/dislike. Let's add dislike to ReactionType or use custom.
    # User specifically asked for like and dislike counts in comments.
    # Let's check ReactionType.

    comment = relationship("Comment", back_populates="reactions")
    shoutout = relationship("ShoutOut", back_populates="comment_reactions")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_reaction'),
    )
