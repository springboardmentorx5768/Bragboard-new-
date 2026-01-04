from database import SessionLocal, engine
import models

def check():
    try:
        db = SessionLocal()
        # Test query
        dept_count = db.query(models.Department).count()
        print(f"Connection successful! Department count: {dept_count}")
        
        user_count = db.query(models.User).count()
        print(f"User count: {user_count}")
        
        brag_count = db.query(models.Brag).count()
        print(f"Brag count: {brag_count}")
        
        db.close()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check()
