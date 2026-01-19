# create_departments.py
import requests
import time

# Wait for server to start
print("Waiting for server to start...")
time.sleep(3)

# Create test admin user first (if needed)
admin_user = {
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin",
    "department_id": 1
}

try:
    # Try to register admin user
    response = requests.post("http://localhost:8000/api/register", json=admin_user)
    if response.status_code == 200:
        print(f"Admin user created: {admin_user['email']}")
    elif response.status_code == 400 and "already registered" in response.text:
        print("Admin user already exists")
    else:
        print(f"Failed to create admin: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error creating admin user: {e}")

# Departments to create
departments = [
    {"name": "Engineering", "description": "Software development team"},
    {"name": "Marketing", "description": "Marketing and sales team"},
    {"name": "HR", "description": "Human resources team"},
    {"name": "Finance", "description": "Finance and accounting team"},
    {"name": "Operations", "description": "Operations management team"},
    {"name": "Sales", "description": "Sales and business development team"},
    {"name": "Product", "description": "Product management team"},
    {"name": "Design", "description": "UI/UX design team"},
    {"name": "Support", "description": "Customer support team"},
    {"name": "QA", "description": "Quality assurance team"}
]

print("\nCreating departments...")

# Login to get token (if we need authentication)
try:
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    login_response = requests.post("http://localhost:8000/api/login", json=login_data)
    
    token = None
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print("Successfully logged in as admin")
except Exception as e:
    print(f"Login error (continuing without auth): {e}")
    token = None

headers = {}
if token:
    headers = {"Authorization": f"Bearer {token}"}

# Create departments
created_count = 0
for dept in departments:
    try:
        response = requests.post(
            "http://localhost:8000/api/departments", 
            json=dept,
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"✅ Created: {dept['name']}")
            created_count += 1
        elif response.status_code == 422:
            print(f"⚠️  Validation error for {dept['name']}: {response.text}")
        elif response.status_code == 409:
            print(f"⚠️  Department '{dept['name']}' already exists")
        else:
            print(f"❌ Failed to create {dept['name']}: {response.status_code} - {response.text}")
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.5)
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to server. Make sure the FastAPI server is running at http://localhost:8000")
        break
    except Exception as e:
        print(f"❌ Error creating {dept['name']}: {e}")
        break

print(f"\n{'='*50}")
print(f"Created {created_count} out of {len(departments)} departments")
print(f"{'='*50}")

# If we have an authentication token, create some test users
if token:
    print("\nCreating test users...")
    
    test_users = [
        {"username": "john_doe", "email": "john@example.com", "password": "password123", "role": "employee", "department_id": 1},
        {"username": "jane_smith", "email": "jane@example.com", "password": "password123", "role": "manager", "department_id": 2},
        {"username": "bob_wilson", "email": "bob@example.com", "password": "password123", "role": "employee", "department_id": 1},
        {"username": "alice_brown", "email": "alice@example.com", "password": "password123", "role": "employee", "department_id": 3},
        {"username": "charlie_davis", "email": "charlie@example.com", "password": "password123", "role": "employee", "department_id": 4},
        {"username": "emma_williams", "email": "emma@example.com", "password": "password123", "role": "employee", "department_id": 5},
        {"username": "michael_jones", "email": "michael@example.com", "password": "password123", "role": "manager", "department_id": 6},
        {"username": "sarah_miller", "email": "sarah@example.com", "password": "password123", "role": "employee", "department_id": 7},
        {"username": "david_taylor", "email": "david@example.com", "password": "password123", "role": "employee", "department_id": 8},
        {"username": "lisa_anderson", "email": "lisa@example.com", "password": "password123", "role": "admin", "department_id": 9},
    ]
    
    for user in test_users:
        try:
            response = requests.post(
                "http://localhost:8000/api/register",
                json=user,
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"✅ Created user: {user['username']} ({user['email']})")
            elif response.status_code == 400 and "already registered" in response.text:
                print(f"⚠️  User '{user['email']}' already exists")
            else:
                print(f"❌ Failed to create user {user['username']}: {response.status_code} - {response.text}")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"❌ Error creating user {user['username']}: {e}")
    
    print("\nTest data creation complete!")
    print("\nLogin Credentials:")
    print("Admin: admin@example.com / admin123")
    print("Manager: jane@example.com / password123")
    print("Employee: john@example.com / password123")

# Create sample shoutouts if we have users
if token and created_count > 0:
    print("\nCreating sample shoutouts...")
    
    # Get users to use as recipients
    try:
        users_response = requests.get(
            "http://localhost:8000/api/users",
            headers=headers
        )
        
        if users_response.status_code == 200:
            users = users_response.json()
            if len(users) >= 3:
                # Create some sample shoutouts
                sample_shoutouts = [
                    {
                        "message": "Great work on the Q4 project! The team delivered ahead of schedule with excellent quality.",
                        "recipient_ids": [user["id"] for user in users[1:4] if user["id"] != 1],  # Skip admin
                        "image_url": None
                    },
                    {
                        "message": "Thanks for helping with the client presentation yesterday. Your insights were invaluable!",
                        "recipient_ids": [users[2]["id"] if len(users) > 2 else 2],
                        "image_url": None
                    },
                    {
                        "message": "Team effort on the new feature release! Everyone contributed significantly to the success.",
                        "recipient_ids": [user["id"] for user in users[3:6] if user["id"] != 1],
                        "image_url": None
                    },
                    {
                        "message": "Excellent customer service this week! Received multiple positive feedbacks from clients.",
                        "recipient_ids": [users[4]["id"] if len(users) > 4 else 3],
                        "image_url": None
                    }
                ]
                
                for shoutout in sample_shoutouts:
                    try:
                        response = requests.post(
                            "http://localhost:8000/api/shoutouts",
                            json=shoutout,
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            print(f"✅ Created shoutout: {shoutout['message'][:50]}...")
                        else:
                            print(f"❌ Failed to create shoutout: {response.status_code}")
                        
                        time.sleep(0.5)
                        
                    except Exception as e:
                        print(f"❌ Error creating shoutout: {e}")
    except Exception as e:
        print(f"Error fetching users for shoutouts: {e}")

print(f"\n{'='*50}")
print("Script completed!")
print(f"{'='*50}") 