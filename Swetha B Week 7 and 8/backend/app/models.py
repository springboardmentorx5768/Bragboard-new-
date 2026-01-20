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
    LAUGHING = "laughing"
    STAR = "star"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    department = Column(String)
    role = Column(String, default="employee") # "admin" or "employee"
    profile_image_url = Column(String, nullable=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    shoutouts_sent = relationship("ShoutOut", back_populates="sender")
    comments = relationship("Comment", back_populates="user")
    reactions = relationship("Reaction", back_populates="user")
    reports_filed = relationship("Report", back_populates="reporter")
    admin_logs = relationship("AdminLog", back_populates="admin")

    # followers = relationship(
    #     "User",
    #     secondary="followers",
    #     primaryjoin="User.id==followers.c.followed_id",
    #     secondaryjoin="User.id==followers.c.follower_id",
    #     backref="following"
    # )

class ShoutOut(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    image_url = Column(String, nullable=True)
    edit_count = Column(Integer, default=0)
    is_edited = Column(Integer, default=0) # 0=False, 1=True
    is_edited = Column(Integer, default=0) # 0=False, 1=True
    last_edited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    location = Column(String, nullable=True)

    sender = relationship("User", back_populates="shoutouts_sent")
    recipients = relationship("ShoutOutRecipient", back_populates="shoutout")
    comments = relationship("Comment", back_populates="shoutout")
    reactions = relationship("Reaction", back_populates="shoutout")
    reports = relationship("Report", back_populates="reports_shoutout")

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
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True) # New field
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shoutout = relationship("ShoutOut", back_populates="comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("Comment", back_populates="parent", remote_side=[id]) # Self-referential
    parent = relationship("Comment", back_populates="replies", remote_side=[parent_id])

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
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True) # New field
    reported_by = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports_shoutout = relationship("ShoutOut", back_populates="reports")
    comment = relationship("Comment")
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

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Recipient
    actor_id = Column(Integer, ForeignKey("users.id")) # Sender
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id"), nullable=True)
    type = Column(String) # 'reaction', 'comment'
    message = Column(String)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
    shoutout = relationship("ShoutOut")

# Association Table for Followers
from sqlalchemy import Table
followers = Table(
    'followers',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('followed_id', Integer, ForeignKey('users.id'), primary_key=True)
)

# Update User model to include followers relationship (This needs to be inside or after User class, but User is already defined. 
# Since we can't easily inject into the middle of the file with replace without reading it all, 
# and the User class is defined early, we might need to use `User.followers = ...` or MonkeyPatch, 
# BUT standard way is to define it inside User.
# Wait, I can't redefine User easily. I'll append the models at the end and I might need to do a broader replace for User or use `User.followers = relationship(...)` after definition if SQLAlchemy allows, but declarative usually prefers inside.
# Actually, I'll just add the new models at the end and then I'll do a separate Replace for User class to add the relationship.
# Let's add the new models first.

class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # 'login', 'post_shoutout', 'follow', 'visit_profile'
    target_id = Column(Integer, nullable=True) # ID of the target (user_id, shoutout_id etc)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", backref="activities")

class ScreenTime(Base):
    __tablename__ = "screen_time"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime) # Store as date or datetime (midnight)
    duration_seconds = Column(Integer, default=0)
    
    user = relationship("User", backref="screen_time_logs")


