import requests

BASE_URL = "http://localhost:8000"

def verify_delete():
    # 1. Register a temporary user
    email = "delete_test@example.com"
    password = "password123"
    print(f"Registering temp user {email}...")
    
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Delete Test",
        "email": email,
        "password": password,
        "department": "QA",
        "role": "employee"
    })
    
    if reg_res.status_code == 400 and "already registered" in reg_res.text:
         print("User already exists, proceeding to login...")
    elif reg_res.status_code != 201:
        print(f"Registration failed: {reg_res.text}")
        return

    # 2. Login
    print("Logging in...")
    auth_res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if auth_res.status_code != 200:
        print(f"Login failed: {auth_res.text}")
        return
    token = auth_res.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create some data (shoutout)
    print("Creating shoutout...")
    requests.post(f"{BASE_URL}/shoutouts/", data={"message": "I will be deleted", "recipient_ids": ["1"]}, headers=headers)

    # 4. Delete Account
    print("Deleting account...")
    del_res = requests.delete(f"{BASE_URL}/users/me", headers=headers)
    
    if del_res.status_code == 204:
        print("Delete request successful (204).")
    else:
        print(f"Delete request failed: {del_res.status_code} {del_res.text}")
        return

    # 5. Verify Login Fails
    print("Verifying account is gone (login attempt)...")
    login_retry = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if login_retry.status_code == 401:
        print("Success: Login failed as expected.")
    else:
        print(f"Failure: User still exists? Status: {login_retry.status_code}")

if __name__ == "__main__":
    verify_delete()
