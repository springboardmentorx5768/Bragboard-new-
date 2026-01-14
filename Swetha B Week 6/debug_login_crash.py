from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def debug_login():
    db = SessionLocal()
    email = "sales_user@example.com"
    print(f"Querying user: {email}")
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        print(f"Found user: {user.name}, Role: {user.role}")
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()
    db.close()

if __name__ == "__main__":
    debug_login()
