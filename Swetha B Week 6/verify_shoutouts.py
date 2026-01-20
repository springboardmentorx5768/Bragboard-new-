import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Failed to login: {response.text}")
        return None

def test_fetch_shoutouts(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    if response.status_code == 200:
        shoutouts = response.json()
        print(f"Successfully fetched {len(shoutouts)} shoutouts")
        return shoutouts
    else:
        print(f"Failed to fetch shoutouts: {response.text}")
        return []

def test_filter_shoutouts(token, params):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/shoutouts/", headers=headers, params=params)
    if response.status_code == 200:
        shoutouts = response.json()
        print(f"Successfully fetched {len(shoutouts)} shoutouts with params {params}")
        return shoutouts
    else:
        print(f"Failed to filter shoutouts: {response.text}")
        return []

if __name__ == "__main__":
    print("Starting verification...")
    email = "admin@bragboard.com"
    password = "password123" # Assuming this is a common test password or known to the user
    
    token = get_token(email, password)
    if token:
        # 1. Fetch all shoutouts
        all_shoutouts = test_fetch_shoutouts(token)
        
        # 2. Test filtering by department
        if all_shoutouts:
            dept = all_shoutouts[0]["sender"]["department"]
            if dept:
                test_filter_shoutouts(token, {"department": dept})
        
        # 3. Test filtering by sender
        if all_shoutouts:
            sender_id = all_shoutouts[0]["sender"]["id"]
            test_filter_shoutouts(token, {"sender_id": sender_id})
        
        # 4. Test filtering by date (today)
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        test_filter_shoutouts(token, {"date_start": f"{today}T00:00:00", "date_end": f"{today}T23:59:59"})
    else:
        print("Could not proceed without token. Please ensure a user exists with password 'password123' or update the script.")
