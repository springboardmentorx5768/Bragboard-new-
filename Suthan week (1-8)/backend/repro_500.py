from database import SessionLocal
import models
import schemas
from pydantic import ValidationError

def repro():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        print(f"Testing {len(users)} users against UserResponse schema...")
        
        for user in users:
            try:
                # Need to use the Config.from_attributes enabled model
                data = schemas.UserResponse.model_validate(user)
            except ValidationError as e:
                print(f"FAIL: User {user.id} ({user.name})")
                print(f"  Error: {e}")
                print(f"  Role type: {type(user.role)} Value: {user.role}")
                print(f"  Joined At: {user.joined_at}")
                if user.department:
                     print(f"  Dept: {user.department.name}")
                else:
                     print("  Dept: None")
                return
        print("ALL PASSED locally.")
    except Exception as e:
        print(f"Script Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    repro()
