from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, schemas
from pydantic import TypeAdapter

def verify_data():
    db = SessionLocal()
    print("Verifying Users...")
    users = db.query(models.User).all()
    for u in users:
        try:
            schemas.UserOut.model_validate(u)
        except Exception as e:
            print(f"User {u.id} failed validation: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

    print("\nVerifying Shoutouts...")
    shoutouts = db.query(models.ShoutOut).all()
    for s in shoutouts:
        try:
            # Manually constructing dict to see relations if needed, 
            # but model_validate should work for ORM objects if Config is set
            schemas.ShoutOutOut.model_validate(s)
        except Exception as e:
            print(f"Shoutout {s.id} failed validation: {e}")
            # print(f"  Sender: {s.sender}")
            # print(f"  Recipients: {s.recipients}")
            
    print("\nVerification Complete.")
    db.close()

if __name__ == "__main__":
    verify_data()
