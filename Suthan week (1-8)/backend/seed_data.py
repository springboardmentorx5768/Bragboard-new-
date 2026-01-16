from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, auth, schemas

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
            {"name": "Software Engineering", "description": "Software development and IT operations"},
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

        # Seed Users
        if db.query(models.User).count() > 0:
            print("Users already seeded.")
            return

        # Fetch departments to assign users
        seeded_departments = db.query(models.Department).all()
        dept_map = {dept.name: dept.id for dept in seeded_departments}

        users_to_seed = [
            {"name": "Alice Smith", "email": "alice@example.com", "password": "password", "department_name": "Software Engineering"},
            {"name": "Bob Johnson", "email": "bob@example.com", "password": "password", "department_name": "HR"},
            {"name": "Charlie Brown", "email": "charlie@example.com", "password": "password", "department_name": "Sales"},
            {"name": "Diana Prince", "email": "diana@example.com", "password": "password", "department_name": "Marketing"},
            {"name": "Eve Adams", "email": "eve@example.com", "password": "password", "department_name": "Finance"},
            {"name": "Frank White", "email": "frank@example.com", "password": "password", "department_name": "Software Engineering"},
        ]

        for user_data in users_to_seed:
            hashed_password = auth.Hash.make(user_data["password"])
            department_id = dept_map.get(user_data["department_name"])

            # Generate unique 4-digit user_id
            import random
            while True:
                user_id_str = str(random.randint(1000, 9999))
                existing = db.query(models.User).filter(models.User.user_id == user_id_str).first()
                if not existing:
                    break

            new_user = models.User(
                name=user_data["name"],
                email=user_data["email"],
                password=hashed_password,
                user_id=user_id_str,
                department_id=department_id,
                role=schemas.UserRole.employee # Default to employee
            )
            db.add(new_user)

        db.commit()
        print("Seeded users successfully!")

    
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
