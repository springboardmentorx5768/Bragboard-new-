from database import SessionLocal, engine
from sqlalchemy import text

def clear_data():
    db = SessionLocal()
    try:
        # Truncate tables in correct order to avoid foreign key constraints
        # Using CASCADE with TRUNCATE cleans up dependent rows automatically in newer Postgres,
        # but explicit order is safer.
        db.execute(text("TRUNCATE TABLE shoutout_recipients, comments, reactions, reports, admin_logs, shoutouts, users, departments RESTART IDENTITY CASCADE"))
        
        db.commit()
        print("Successfully cleared ALL data (Users, Departments, Posts, etc).")
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()
