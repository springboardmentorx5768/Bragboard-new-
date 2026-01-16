import requests
import sys
from sqlalchemy.orm import Session
from database import SessionLocal
import models, auth, schemas

BASE_URL = "http://localhost:8000"

def ensure_admin_exists():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == "admin@bragboard.com").first()
        if not admin:
            print("Creating Admin User...")
            hashed_password = auth.Hash.make("admin123")
            admin = models.User(
                name="System Admin",
                email="admin@bragboard.com",
                password=hashed_password,
                user_id="9999",
                role=models.UserRole.admin
            )
            db.add(admin)
            db.commit()
            print("Admin User Created.")
        else:
            # Ensure role is admin
            if admin.role != models.UserRole.admin:
                print("Updating existing user to Admin...")
                admin.role = models.UserRole.admin
                db.commit()
            print("Admin User Exists.")
        return admin
    except Exception as e:
        print(f"Error checking/creating admin: {e}")
        return None
    finally:
        db.close()

def ensure_employee_exists():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == "alice@example.com").first()
        if not user:
            print("Creating Employee User...")
            hashed_password = auth.Hash.make("password")
            user = models.User(
                name="Alice Smith",
                email="alice@example.com",
                password=hashed_password,
                user_id="1001",
                role=models.UserRole.employee
            )
            db.add(user)
            db.commit()
        return user
    except Exception as e:
         print(f"Error checking employee: {e}")
    finally:
        db.close()

def test_api_login(email, password, login_type, expected_status, description):
    url = f"{BASE_URL}/api/login"
    payload = {
        "email": email,
        "password": password,
        "login_type": login_type
    }
    try:
        print(f"\nTEST: {description}")
        print(f"  Attempting login for {email} as {login_type}...")
        response = requests.post(url, json=payload)
        if response.status_code == expected_status:
            print(f"  PASS: Status code {response.status_code}")
            return True
        else:
            print(f"  FAIL: Expected {expected_status}, got {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

if __name__ == "__main__":
    print("--- Setting up Test Data ---")
    admin = ensure_admin_exists()
    employee = ensure_employee_exists()
    
    if not admin or not employee:
        print("Failed to setup users. Exiting.")
        sys.exit(1)
        
    print("\n--- Starting Verification ---")
    
    # 1. Admin Login as Admin (Email) -> Should Pass
    test_api_login("admin@bragboard.com", "admin123", "admin", 200, "Admin logging in as Admin (Email)")
    
    # 2. Employee Login as Admin -> Should Fail (403)
    test_api_login("alice@example.com", "password", "admin", 403, "Employee attempting Admin login")
    
    # 3. Employee Login as Employee (Email) -> Should Pass
    test_api_login("alice@example.com", "password", "employee", 200, "Employee logging in as Employee (Email)")
    
    # 4. Employee Login as Employee (User ID) -> Should Pass
    # Assuming alice's user_id is 1001 or whatever was found/created
    db = SessionLocal()
    alice = db.query(models.User).filter(models.User.email == "alice@example.com").first()
    alice_id = alice.user_id if alice else "1001"
    db.close()
    
    test_api_login(alice_id, "password", "employee", 200, "Employee logging in with User ID")
    
    # 5. Admin Login as Employee -> Should Pass (Admins can likely log in to employee portal too, or at least pass authentication)
    test_api_login("admin@bragboard.com", "admin123", "employee", 200, "Admin logging in as Employee")
    
