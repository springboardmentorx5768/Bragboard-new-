from database import SessionLocal
import models
import schemas
from pydantic import ValidationError

def debug_schema():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        print(f"Found {len(users)} users in DB.")
        
        for user in users:
            try:
                # Try to validate using from_orm like FastAPI does
                schemas.UserResponse.from_orm(user)
            except ValidationError as e:
                print(f"Validation Error for User ID {user.id} ({user.name}):")
                print(e)
                # print raw values
                print(f"  role: {user.role} ({type(user.role)})")
                print(f"  joined_at: {user.joined_at}")
                print(f"  department: {user.department}")
    except Exception as e:
        print(f"Error querying DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_schema()
