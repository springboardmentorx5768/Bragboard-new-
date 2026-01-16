import requests

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

def verify_report(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get shoutout
    res_shout = requests.get(f"{BASE_URL}/api/shoutouts/", headers=headers)
    if not res_shout.ok or not res_shout.json():
        print("No shoutouts found.")
        return
    
    shoutout_id = res_shout.json()[0]['id']
    print(f"Reporting Shoutout ID: {shoutout_id}")
    
    # 2. Report it
    report_payload = {
        "shoutout_id": shoutout_id,
        "reason": "Automated verification report."
    }
    
    res_report = requests.post(f"{BASE_URL}/api/shoutouts/{shoutout_id}/report", json=report_payload, headers=headers)
    
    if res_report.ok:
        print("Report submitted successfully!")
        print(res_report.json())
    else:
        print(f"Report failed: {res_report.status_code} {res_report.text}")

if __name__ == "__main__":
    token = get_token()
    if token:
        verify_report(token)
