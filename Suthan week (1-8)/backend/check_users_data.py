from database import SessionLocal
import models
from sqlalchemy import text

def check_users():
    db = SessionLocal()
    try:
        # Check if table exists (via SQLAlchemy check)
        try:
            user_count = db.query(models.User).count()
            print(f"Total Users found: {user_count}")
            
            if user_count > 0:
                print("First 5 users:")
                users = db.query(models.User).limit(5).all()
                for user in users:
                    print(f" - ID: {user.id}, Name: {user.name}, Email: {user.email}, Role: {user.role}")
            else:
                print("The 'users' table is empty.")
                
        except Exception as e:
            print(f"Error querying users table: {e}")
            
    except Exception as e:
        print(f"Database connection error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
