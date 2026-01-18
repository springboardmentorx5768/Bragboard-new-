from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

# association table for tagged users
shoutout_users = Table(
    "shoutout_users",
    Base.metadata,
    Column("shoutout_id", ForeignKey("shoutouts.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)

class ShoutOut(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)

    tagged_users = relationship(
        "User",
        secondary=shoutout_users,
        back_populates="shoutouts"
    )
