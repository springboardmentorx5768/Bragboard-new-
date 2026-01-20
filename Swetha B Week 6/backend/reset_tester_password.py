from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
try:
    from app.security import hash_password
except ImportError:
    # Fallback if app.security is not directly importable from this path
    import sys
    import os
    sys.path.append(os.getcwd())
    from app.security import hash_password

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    email = "comment_tester@example.com"
    new_password = "password123"
    hashed_pwd = hash_password(new_password)
    
    # Update the user's password
    db.execute(
        text("UPDATE users SET password = :pwd WHERE email = :email"),
        {"pwd": hashed_pwd, "email": email}
    )
    db.commit()
    print(f"Successfully updated password for {email} to '{new_password}'")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
