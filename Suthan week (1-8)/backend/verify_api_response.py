import requests
import json

BASE_URL = "http://localhost:8000"

def get_token():
    url = f"{BASE_URL}/api/login"
    payload = {
        "email": "admin@bragboard.com",
        "password": "admin123",
        "login_type": "admin"
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        return res.json()["access_token"]
    print("Login failed")
    return None

def verify_users(token):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{BASE_URL}/api/users"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        users = res.json()
        print(f"Fetched {len(users)} users.")
        if len(users) > 0:
            print("Sample User JSON:")
            print(json.dumps(users[0], indent=2))
            
            # Check department field specifically
            missing_dept = [u['email'] for u in users if not u.get('department')]
            if missing_dept:
                print(f"WARNING: {len(missing_dept)} users have no department info in API response.")
                print("Examples:", missing_dept[:3])
            else:
                print("ALL users have department info in API response.")
    else:
        print(f"Failed to fetch users: {res.status_code} {res.text}")

    # Check Departments
    url_dept = f"{BASE_URL}/api/departments/"
    res_dept = requests.get(url_dept, headers=headers)
    if res_dept.status_code == 200:
        depts = res_dept.json()
        print(f"Fetched {len(depts)} departments.")
    else:
        print(f"Failed to fetch departments: {res_dept.status_code} {res_dept.text}")

if __name__ == "__main__":
    token = get_token()
    if token:
        verify_users(token)
