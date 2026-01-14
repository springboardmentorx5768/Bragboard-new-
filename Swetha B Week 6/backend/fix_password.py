from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.security import hash_password

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    email = "testuser123@gmail.com"
    new_password = "password123"
    hashed_pwd = hash_password(new_password)
    
    # Update the user's password
    db.execute(
        text("UPDATE users SET password = :pwd WHERE email = :email"),
        {"pwd": hashed_pwd, "email": email}
    )
    db.commit()
    print(f"Successfully updated password for {email} to '{new_password}'")
    
    # Verify
    result = db.execute(text("SELECT email, password FROM users WHERE email = :email"), {"email": email})
    user = result.fetchone()
    print(f"New Hash: {user.password}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
