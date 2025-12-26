from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association table for shoutout recipients (many-to-many)
shoutout_recipients = Table(
    'shoutout_recipients',
    Base.metadata,
    Column('shoutout_id', Integer, ForeignKey('shoutouts.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default='employee')  # employee, manager, admin
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="users")
    sent_shoutouts = relationship("Shoutout", back_populates="sender", foreign_keys="Shoutout.sender_id")
    received_shoutouts = relationship("Shoutout", secondary=shoutout_recipients, back_populates="recipients")

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="department")

    def __repr__(self):
        return f"<Department(name='{self.name}')>"


class Shoutout(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", back_populates="sent_shoutouts", foreign_keys=[sender_id])
    recipients = relationship("User", secondary=shoutout_recipients, back_populates="received_shoutouts")

    def __repr__(self):
        return f"<Shoutout(id={self.id}, sender_id={self.sender_id})>"