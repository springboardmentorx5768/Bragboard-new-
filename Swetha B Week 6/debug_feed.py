import requests

BASE_URL = "http://localhost:8000"

# Use credentials we likely have (e.g., from verify_week4.py or seed)
# Trying to login as one of the seed users or sales_user
EMAIL = "sales_user@example.com"
PASSWORD = "password123"

def debug_feed():
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    auth_res = requests.post(f"{BASE_URL}/auth/token", data={"username": EMAIL, "password": PASSWORD})
    if auth_res.status_code != 200:
        # Try a seed user if sales_user fails (maybe deleted/reseeded?)
        print("Login failed, trying user1@example.com...")
        auth_res = requests.post(f"{BASE_URL}/auth/token", data={"username": "user1@example.com", "password": PASSWORD})
        if auth_res.status_code != 200:
            print("Login failed completely.")
            print(auth_res.text)
            return

    token = auth_res.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Fetch Feed (No filters, just like default load)
    print("Fetching /shoutouts/ ...")
    res = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Count: {len(data)}")
        if len(data) > 0:
            print("First item sample:")
            print(data[0])
        else:
            print("Feed is empty array []")
    else:
        print("Error response:", res.text)

if __name__ == "__main__":
    debug_feed()
