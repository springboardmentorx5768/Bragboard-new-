import requests
import json

BASE_URL = "http://localhost:8000"

def test_login(email, password, login_type, expected_status):
    url = f"{BASE_URL}/api/login"
    payload = {
        "email": email,
        "password": password,
        "login_type": login_type
    }
    try:
        response = requests.post(url, json=payload)
        if response.status_code == expected_status:
            print(f"PASS: Login as {login_type} for {email}. Status: {response.status_code}")
        else:
            print(f"FAIL: Login as {login_type} for {email}. Expected {expected_status}, got {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")

# Assuming seed data exists or we can use known users. 
# Based on previous context, 'admin@example.com' / 'admin123' might exist.
# Let's try to assume some standard users or check the DB first. SInce I can't check DB easily via script without setup, 
# I will try to read the seed_data.py to guess users or just try common ones.

if __name__ == "__main__":
    print("Verifying Login Logic...")
    # These credits are assumptions, if they fail I'll need to check seed_data.py
    # Test 1: Admin Login with Admin Creds (assuming admin@example.com exists)
    # If no admin exists, this will fail 404, which is fine, I just want to see if logic holds.
    
    # Actually, let's look at seed_data.py first to get valid credentials.
    pass
