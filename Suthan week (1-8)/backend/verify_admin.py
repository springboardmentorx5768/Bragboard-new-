import requests
import json

BASE_URL = "http://localhost:8000"

def get_admin_token():
    url = f"{BASE_URL}/api/login"
    payload = {
        "email": "admin@bragboard.com",
        "password": "admin123", # Assuming this is the admin creds seeded or created
        "login_type": "admin"
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Admin Login failed: {res.text}")
    return None

def verify_admin(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Stats
    print("Fetching Admin Stats...")
    res_stats = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
    if res_stats.ok:
        print(json.dumps(res_stats.json(), indent=2))
    else:
        print(f"Stats check failed: {res_stats.status_code} {res_stats.text}")

    # 2. Reports
    print("Fetching Reports...")
    res_reports = requests.get(f"{BASE_URL}/api/admin/reports", headers=headers)
    if res_reports.ok:
        reports = res_reports.json()
        print(f"Found {len(reports)} reports.")
        if len(reports) > 0:
            print(f"Sample Report: {reports[0]}")
    else:
        print(f"Reports check failed: {res_reports.status_code} {res_reports.text}")

if __name__ == "__main__":
    token = get_admin_token()
    if token:
        verify_admin(token)
