from app.database import SessionLocal
from app.models import ShoutOut, User

db = SessionLocal()
try:
    user_count = db.query(User).count()
    shoutout_count = db.query(ShoutOut).count()
    print(f"Users: {user_count}")
    print(f"Shoutouts: {shoutout_count}")
finally:
    db.close()
