from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import ShoutOut, User, ShoutOutRecipient
from app.database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_shoutouts():
    db = SessionLocal()
    shoutouts = db.query(ShoutOut).all()
    print(f"Total shoutouts found: {len(shoutouts)}")
    print("-" * 50)
    for shoutout in shoutouts:
        sender_name = shoutout.sender.name if shoutout.sender else "Unknown"
        print(f"ID: {shoutout.id}")
        print(f"Sender: {sender_name} (ID: {shoutout.sender_id})")
        print(f"Message: {shoutout.message}")
        print(f"Date: {shoutout.created_at}")
        
        recipients = [r.recipient.name for r in shoutout.recipients if r.recipient]
        print(f"Recipients: {', '.join(recipients)}")
        print("-" * 50)
    db.close()

if __name__ == "__main__":
    check_shoutouts()
