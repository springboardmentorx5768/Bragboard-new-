import requests
import datetime

BASE_URL = "http://localhost:8000"

def get_token():
    # Attempt to login with common credentials or use existing logic
    # For this verification, we assume the server is running and we can use a tester account
    login_data = {"username": "tester@example.com", "password": "password123"}
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def verify_date_filter():
    token = get_token()
    if not token:
        print("Failed to get token")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch all shoutouts to find a specific date
    response = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch shoutouts: {response.status_code}")
        return
    
    shoutouts = response.json()
    if not shoutouts:
        print("No shoutouts found to test with")
        return
    
    # Pick a date from an existing shoutout
    test_shoutout = shoutouts[0]
    test_date_str = test_shoutout["created_at"]
    # Usually ISO format '2025-12-30T10:30:00'
    test_date = datetime.datetime.fromisoformat(test_date_str.replace('Z', ''))
    date_query = test_date.strftime("%Y-%m-%dT00:00:00Z")
    
    print(f"Testing with date: {date_query}")
    
    # 2. Filter by that specific date
    params = {"date_start": date_query}
    response = requests.get(f"{BASE_URL}/shoutouts/", headers=headers, params=params)
    
    if response.status_code == 200:
        filtered_shoutouts = response.json()
        print(f"Found {len(filtered_shoutouts)} shoutouts for {date_query}")
        
        # Verify all returned shoutouts are from the same day
        mismatched = []
        for s in filtered_shoutouts:
            s_date = datetime.datetime.fromisoformat(s["created_at"].replace('Z', ''))
            if s_date.date() != test_date.date():
                mismatched.append(s["created_at"])
        
        if mismatched:
            print(f"FAIL: Found shoutouts from other dates: {mismatched}")
        else:
            print("SUCCESS: All filtered shoutouts are from the correct day.")
    else:
        print(f"Filter request failed: {response.status_code}")

if __name__ == "__main__":
    verify_date_filter()
