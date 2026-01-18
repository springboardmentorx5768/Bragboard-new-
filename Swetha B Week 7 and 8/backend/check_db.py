from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    result = db.execute(text("SELECT id, email, name, password, role FROM users"))
    users = result.fetchall()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"ID: {user.id}, Email: {user.email}, Name: {user.name}, Role: {user.role}")
        print(f"Hash: {user.password}")
        print("-" * 20)
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
