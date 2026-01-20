from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, UserRole
from app.database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_users():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Total users found: {len(users)}")
    for user in users:
        print(f"ID: {user.id}, Name: {user.name}, Role: {user.role}, Dept: {user.department}, Joined: {user.joined_at}")
        if user.joined_at is None:
            print(f"WARNING: User {user.id} has NULL joined_at")
        if user.email is None:
            print(f"WARNING: User {user.id} has NULL email")
    db.close()

if __name__ == "__main__":
    check_users()
