from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# Ensure tables are created (redundant if main.py ran, but good for standalone)
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if departments exist
        if db.query(models.Department).count() > 0:
            print("Departments already seeded.")
            return

        departments = [
            {"name": "Engineering", "description": "Software development and IT operations"},
            {"name": "HR", "description": "Human Resources and Talent Acquisition"},
            {"name": "Sales", "description": "Sales and Business Development"},
            {"name": "Marketing", "description": "Brand awareness and market research"},
            {"name": "Finance", "description": "Accounting and financial planning"}
        ]

        for dept_data in departments:
            dept = models.Department(**dept_data)
            db.add(dept)
        
        db.commit()
        print("Seeded departments successfully!")
    
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
