from database import SessionLocal, engine
from sqlalchemy import text

def clear_shoutouts():
    """Clear all shoutout-related data but keep users and departments"""
    db = SessionLocal()
    try:
        print("Clearing all shoutout data...")
        # Delete in order to respect foreign key constraints
        db.execute(text("DELETE FROM reactions;"))
        db.execute(text("DELETE FROM comments;"))
        db.execute(text("DELETE FROM reports;"))
        db.execute(text("DELETE FROM shoutout_recipients;"))
        db.execute(text("DELETE FROM shoutouts;"))
        db.commit()
        print("Successfully cleared all shoutout data (shoutouts, recipients, reactions, comments, reports).")
        print("Users and departments are preserved.")
    except Exception as e:
        print(f"Error clearing shoutout data: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    clear_shoutouts()



