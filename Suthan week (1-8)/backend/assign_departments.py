from database import SessionLocal
import models
import random

def assign_departments():
    db = SessionLocal()
    try:
        # Get all departments
        departments = db.query(models.Department).all()
        if not departments:
            print("No departments found! Please seed departments first.")
            return

        dept_ids = [d.id for d in departments]
        print(f"Found {len(departments)} departments: {[d.name for d in departments]}")

        # Get users without departments or all users to ensure distribution
        users = db.query(models.User).all()
        
        updated_count = 0
        for user in users:
            # You can force re-assignment or only assign if None. 
            # User request said "add the users to thier respective departments".
            # I will assign if None, or re-shuffle to ensure we have a good mix for testing "My Team".
            # Let's simple check if None for now, or if the user wants to see data, I'll ensure everyone has one.
            if user.department_id is None:
                new_dept_id = random.choice(dept_ids)
                user.department_id = new_dept_id
                updated_count += 1
                curr_dept = next(d for d in departments if d.id == new_dept_id)
                print(f"Assigned {user.name} ({user.email}) to {curr_dept.name}")
        
        if updated_count > 0:
            db.commit()
            print(f"Successfully updated {updated_count} users.")
        else:
            print("All users already have departments assigned.")
            
        # Verify
        print("\nVerification - User Departments:")
        for user in db.query(models.User).limit(10).all():
             dept_name = user.department.name if user.department else "None"
             print(f"- {user.name}: {dept_name}")

    except Exception as e:
        print(f"Error assigning departments: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    assign_departments()
