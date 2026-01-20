from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def get_users():
    users = db.query(User).all()
    with open("creds_output_full.txt", "w") as f:
        for user in users:
            f.write(f"Name: {user.name} | Email: {user.email} | Dept: {user.department}\n")

if __name__ == "__main__":
    try:
        get_users()
    finally:
        db.close()
