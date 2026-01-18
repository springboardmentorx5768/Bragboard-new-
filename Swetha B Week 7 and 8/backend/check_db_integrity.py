from app.database import SessionLocal
from app.models import ShoutOut, User

db = SessionLocal()
try:
    users = [u.id for u in db.query(User).all()]
    shoutouts = db.query(ShoutOut).all()
    
    valid_shoutouts = 0
    for s in shoutouts:
        if s.sender_id in users:
            valid_shoutouts += 1
            
    print(f"Total Shoutouts: {len(shoutouts)}")
    print(f"Shoutouts with valid Sender: {valid_shoutouts}")
    
    if len(shoutouts) > 0:
        print(f"First Shoutout Date: {shoutouts[0].created_at}")

finally:
    db.close()
