import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path to import app modules
# We determine the path relative to this script
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from app.models import ShoutOut
except ImportError:
    # If app is not found, it might mean we need to be careful about how we import
    # or that the backend structure is different. But based on previous checks, this should work
    # if backend is in sys.path
    print("Error importing app modules. Ensure 'backend' directory exists and contains 'app' package.")
    sys.exit(1)

# Database file is expected to be in backend/bragboard.db
db_path = os.path.join(backend_dir, 'bragboard.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def list_shoutouts():
    print(f"Connecting to database at: {db_path}")
    db = SessionLocal()
    try:
        shoutouts = db.query(ShoutOut).all()
        
        print("\n=== BragBoard Shoutout Posts ===\n")
        
        if not shoutouts:
            print("No shoutouts found.")
            return

        for shoutout in shoutouts:
            # Get sender name
            sender_name = shoutout.sender.name if shoutout.sender else "Unknown"
            
            # Get recipient names
            # shoutout.recipients is a list of ShoutOutRecipient objects
            # each has a 'recipient' relationship to User
            recipient_names = []
            for r in shoutout.recipients:
                if r.recipient:
                    recipient_names.append(r.recipient.name)
            
            recipients_str = ", ".join(recipient_names) if recipient_names else "None"
            
            print(f"Message:   {shoutout.message}")
            print(f"Sender:    {sender_name}")
            print(f"Receiver:  {recipients_str}")
            print("-" * 40)
            
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_shoutouts()
