from database import SessionLocal
from models import User, Brag, Shoutout, Notification, shoutout_recipients
from sqlalchemy import delete

def delete_all_users():
    db = SessionLocal()
    try:
        print("Starting cleanup process...")
        
        # 1. Delete Shoutout Recipients (Association Table)
        print("Deleting shoutout recipients...")
        db.execute(shoutout_recipients.delete())
        
        # 2. Delete Notifications
        print("Deleting notifications...")
        db.query(Notification).delete()
        
        # 3. Delete Brags
        print("Deleting brags...")
        db.query(Brag).delete()
        
        # 4. Delete Shoutouts
        print("Deleting shoutouts...")
        db.query(Shoutout).delete()
        
        # 5. Delete Users
        print("Deleting users...")
        num_users = db.query(User).delete()
        
        db.commit()
        print(f"SUCCESS: Deleted {num_users} users and all related data.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_users()
