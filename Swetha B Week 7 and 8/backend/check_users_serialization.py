from app.database import SessionLocal
from app import models, schemas
import pydantic

print(f"Pydantic version: {pydantic.VERSION}")

db = SessionLocal()
users = db.query(models.User).all()
print(f"Total users: {len(users)}")

for u in users:
    try:
        # Attempt minimal validation
        # Adjust for possible Pydantic version
        if hasattr(schemas.UserOut, 'model_validate'):
            schemas.UserOut.model_validate(u)
        else:
            schemas.UserOut.from_orm(u)
    except Exception as e:
        print(f"User {u.id} ({u.name}) FAILED serialization:")
        print(e)
        if hasattr(e, 'errors'):
            print(e.errors())
        # Continue to check others

print("Check complete.")
db.close()
