from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base
from models.shoutout import shoutout_users

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)

    shoutouts = relationship(
        "ShoutOut",
        secondary=shoutout_users,
        back_populates="tagged_users"
    )
