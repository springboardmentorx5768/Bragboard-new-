
import requests
import json
import uuid

BASE_URL = "http://localhost:8000"

def main():
    # 1. Register a new user
    email = f"test_{str(uuid.uuid4())[:8]}@example.com"
    password = "password123"
    print(f"Registering user {email}...")
    
    reg_data = {
        "name": "Test User",
        "email": email,
        "password": password,
        "role": "employee"
    }
    
    resp = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    if resp.status_code != 201:
        print(f"Registration failed: {resp.text}")
        return

    # 2. Login
    print("Logging in...")
    login_data = {"email": email, "password": password}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create another user to send message TO (or just list users)
    resp = requests.get(f"{BASE_URL}/users/", headers=headers)
    if resp.status_code != 200:
        print("Failed to get users")
        return
    users = resp.json()
    if not users:
        print("No users found")
        return
    recipient_id = users[0]['id']
    
    # 4. Create Shoutout
    print("Creating shoutout...")
    # NOTE: requests handles lists in data by sending multiple values with same key
    shoutout_data = {
        "message": "Original Message",
        "recipient_ids": [str(recipient_id)]
    }
    
    resp = requests.post(f"{BASE_URL}/shoutouts/", headers=headers, data=shoutout_data)
    if resp.status_code != 200:
        print(f"Create shoutout failed: {resp.text}")
        return
    
    shoutout = resp.json()
    shoutout_id = shoutout['id']
    print(f"Created shoutout {shoutout_id}")
    
    # 5. Edit Shoutout
    print("Editing shoutout...")
    edit_data = {"message": "Edited Message"}
    resp = requests.put(f"{BASE_URL}/shoutouts/{shoutout_id}", headers=headers, data=edit_data)
    
    print(f"Edit Response Code: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Edit Response Message: {data.get('message')}")
        print(f"Edit Response is_edited: {data.get('is_edited')}")
    else:
        print(f"Edit Response Error: {resp.text}")

if __name__ == "__main__":
    main()
