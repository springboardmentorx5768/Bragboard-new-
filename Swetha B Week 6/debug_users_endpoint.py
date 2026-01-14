import requests
import sys

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json()['access_token']
    print("Login failed:", res.text)
    return None

def check_users():
    # Use the credentials from verify_week4.py
    email = "sales_user@example.com"
    password = "password123"
    
    token = get_token(email, password)
    if not token:
        print("Could not get token to test /users/")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print(f"Testing GET {BASE_URL}/users/ ...")
    try:
        res = requests.get(f"{BASE_URL}/users/", headers=headers)
        if res.status_code == 200:
            users = res.json()
            print(f"Success! Status: 200")
            print(f"User count: {len(users)}")
            print("Users found:", users)
        else:
            print(f"Failed! Status: {res.status_code}")
            print("Response:", res.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_users()
