import requests
import random

BASE_URL = "http://localhost:8000"

departments = ["HR", "Marketing", "Engineering", "Sales", "Finance", "Product"]

def seed_users():
    print("Seeding users...")
    for i in range(1, 11):
        name = f"User {i}"
        email = f"user{i}@example.com"
        password = "password123"
        dept = random.choice(departments)
        
        user_data = {
            "email": email,
            "password": password,
            "name": name,
            "department": dept,
            "role": "employee"
        }
        
        try:
            res = requests.post(f"{BASE_URL}/auth/register", json=user_data)
            if res.status_code == 201:
                print(f"Created {name} ({dept})")
            elif res.status_code == 400 and "already registered" in res.text:
                print(f"{name} already exists")
            else:
                print(f"Failed to create {name}: {res.status_code} {res.text}")
        except Exception as e:
            print(f"Error creating {name}: {e}")

if __name__ == "__main__":
    seed_users()
