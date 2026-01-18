from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    # Fetch all users
    result = db.execute(text("SELECT id, email FROM users"))
    users = result.fetchall()
    
    print(f"Found {len(users)} users. Normalizing emails...")
    
    count = 0
    for user in users:
        if user.email != user.email.lower():
            new_email = user.email.lower()
            print(f"Updating {user.email} -> {new_email}")
            db.execute(
                text("UPDATE users SET email = :new_email WHERE id = :id"),
                {"new_email": new_email, "id": user.id}
            )
            count += 1
            
    db.commit()
    print(f"Successfully normalized {count} emails to lowercase.")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
