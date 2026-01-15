from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Load database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to SQLite for local development
if not DATABASE_URL:
    import os
    DATABASE_URL = f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'bragboard.db')}"

# SQLAlchemy base
Base = declarative_base()

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    # pool_pre_ping=True  # Commented out for testing
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ REQUIRED BY FASTAPI DEPENDENCY INJECTION
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
