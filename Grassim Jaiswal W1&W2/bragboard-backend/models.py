from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean
from datetime import datetime
from database import Base  

class User(Base):
    __tablename__ = "users"

    # Columns as given in documentation
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    department = Column(String, nullable=True)
    role = Column(String, default="employee")
    joined_at = Column(TIMESTAMP, default=datetime.utcnow)