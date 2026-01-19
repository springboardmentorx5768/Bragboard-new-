# app/models.py
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class RoleEnum(str, enum.Enum):
    employee = "employee"
    admin = "admin"

class ReactionType(str, enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"

class ReportStatus(str, enum.Enum):
    pending = "pending"
    resolved = "resolved"
    dismissed = "dismissed"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    department = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.employee, nullable=False)
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

# Association table for brag recipients
brag_recipients = Table(
    'brag_recipients',
    Base.metadata,
    Column('brag_id', Integer, ForeignKey('brags.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class Brag(Base):
    __tablename__ = "brags"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    author = relationship("User", backref="brags")
    recipients = relationship("User", secondary=brag_recipients, backref="received_brags")
    attachments = relationship("Attachment", backref="brag", cascade="all, delete-orphan")
    reactions = relationship("Reaction", backref="brag", cascade="all, delete-orphan")
    comments = relationship("Comment", backref="brag", cascade="all, delete-orphan")

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)
    brag_id = Column(Integer, ForeignKey('brags.id'), nullable=False)
    uploaded_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    brag_id = Column(Integer, ForeignKey('brags.id'), nullable=False)
    reaction_type = Column(Enum(ReactionType), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="reactions")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    brag_id = Column(Integer, ForeignKey('brags.id'), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="comments")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    brag_id = Column(Integer, ForeignKey('brags.id'), nullable=False)
    reported_by_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    reason = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending, nullable=False)
    resolution_notes = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    resolved_at = Column(TIMESTAMP(timezone=True), nullable=True)
    resolved_by_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Relationships
    brag = relationship("Brag", backref="reports")
    reported_by = relationship("User", foreign_keys=[reported_by_id], backref="reports_made")
    resolved_by = relationship("User", foreign_keys=[resolved_by_id], backref="reports_resolved")


class Leaderboard(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True, index=True)
    brags_sent = Column(Integer, default=0)
    appreciations_received = Column(Integer, default=0)  # Total reactions + comments received
    reactions_given = Column(Integer, default=0)
    total_points = Column(Integer, default=0)  # Calculated field: (brags_sent * 5) + (appreciations_received * 2) + (reactions_given * 1)
    last_updated = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="leaderboard_entry", uselist=False)

