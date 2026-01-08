import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000/api"
EMAIL = "john@example.com" # Adjust if needed
PASSWORD = "password123" # Adjust if needed

# Retry loop for connection
max_retries = 10
for i in range(max_retries):
    try:
        print(f"Attempting connection ({i+1}/{max_retries})...")
        # Just check root to see if alive
        requests.get(f"http://localhost:8000/")
        break
    except requests.exceptions.ConnectionError:
        if i == max_retries - 1:
            print("Could not connect to backend after multiple attempts.")
            sys.exit(1)
        print("Backend not ready, waiting...")
        time.sleep(2)

try:
    print(f"Logging in as {EMAIL}...")
    auth_resp = requests.post(f"{BASE_URL}/login", json={"email": EMAIL, "password": PASSWORD})
    
    if auth_resp.status_code == 404:
        print("User not found, registering...")
        # Get a department first
        # Assuming simplified registration or just passing 1 (might fail if no depts)
        reg_data = {
            "name": "John Doe",
            "email": EMAIL,
            "password": PASSWORD,
            "department_id": 1
        }
        reg_resp = requests.post(f"{BASE_URL}/register", json=reg_data)
        if reg_resp.status_code not in [200, 201]:
             print(f"Registration failed: {reg_resp.text}")
             # Try without dept?
             reg_data.pop("department_id")
             reg_resp = requests.post(f"{BASE_URL}/register", json=reg_data)
             if reg_resp.status_code not in [200, 201]:
                 print(f"Registration failed again: {reg_resp.text}")
                 sys.exit(1)
        
        print("Registered successfully. Logging in...")
        auth_resp = requests.post(f"{BASE_URL}/login", json={"email": EMAIL, "password": PASSWORD})

    if auth_resp.status_code != 200:
        print(f"Login failed: {auth_resp.text}")
        sys.exit(1)


    
    if auth_resp.status_code != 200:
        print("Login failed, trying to register...")
        # Try registration if login fails (first run maybe)
        # But assuming user exists from previous tasks.
        # Let's try to find a user first or just exit.
        print(f"Login error: {auth_resp.text}")
        sys.exit(1)
        
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 1. Get Shoutouts
    print("Fetching shoutouts...")
    shoutouts_resp = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    if shoutouts_resp.status_code != 200:
        print(f"Failed to fetch shoutouts: {shoutouts_resp.text}")
        sys.exit(1)
        
    shoutouts = shoutouts_resp.json()
    if not shoutouts:
        print("No shoutouts found to test reactions on.")
        # Create one if needed? 
        # For now assume one exists.
        sys.exit(0)
    
    target_id = shoutouts[0]["id"]
    print(f"Testing reactions on shoutout ID: {target_id}")
    
    # 2. Add Reaction (Like)
    print("Adding 'like' reaction...")
    react_resp = requests.post(f"{BASE_URL}/shoutouts/{target_id}/react", json={"type": "like"}, headers=headers)
    if react_resp.status_code != 200:
        print(f"Reaction failed: {react_resp.text}")
        sys.exit(1)
        
    data = react_resp.json()
    print(f"Reaction added. Counts: {data.get('reaction_counts')}, User Reaction: {data.get('current_user_reaction')}")
    assert data['current_user_reaction'] == 'like'
    assert data['reaction_counts']['like'] >= 1
    
    # 3. Change Reaction (Clap)
    print("Changing to 'clap' reaction...")
    react_resp = requests.post(f"{BASE_URL}/shoutouts/{target_id}/react", json={"type": "clap"}, headers=headers)
    data = react_resp.json()
    print(f"Reaction changed. Counts: {data.get('reaction_counts')}, User Reaction: {data.get('current_user_reaction')}")
    assert data['current_user_reaction'] == 'clap'
    
    # 4. Remove Reaction (Toggle off)
    print("Toggling off 'clap' reaction...")
    react_resp = requests.post(f"{BASE_URL}/shoutouts/{target_id}/react", json={"type": "clap"}, headers=headers)
    data = react_resp.json()
    print(f"Reaction removed. Counts: {data.get('reaction_counts')}, User Reaction: {data.get('current_user_reaction')}")
    assert data['current_user_reaction'] is None
    
    print("Verification ALL PASSED!")

except requests.exceptions.ConnectionError:
    print("Connection error. Make sure the backend is running at http://localhost:8000")
except Exception as e:
    print(f"An error occurred: {e}")
