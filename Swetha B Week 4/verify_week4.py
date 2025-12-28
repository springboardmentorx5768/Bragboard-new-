import requests
import sys

BASE_URL = "http://localhost:8000"

def test_week4():
    # 1. Register User A (Sales)
    email_a = "sales_user@example.com"
    password = "password123"
    user_data_a = {
        "email": email_a,
        "password": password,
        "name": "Sales User",
        "department": "Sales",
        "role": "employee"
    }
    
    # Try login first to see if exists, if not register
    token_a = login(email_a, password)
    if not token_a:
        print(f"Registering {email_a}...")
        res = requests.post(f"{BASE_URL}/auth/register", json=user_data_a)
        if res.status_code not in [200, 201]:
             # Might already exist
             print("User might exist or error:", res.text)
        token_a = login(email_a, password)
        if not token_a:
            print("Failed to login User A")
            return

    print("User A Logged in.")

    # 2. Register User B (Engineering) (Recipient)
    email_b = "eng_user@example.com"
    user_data_b = {
        "email": email_b,
        "password": password,
        "name": "Eng User",
        "department": "Engineering"
    }
    
    token_b = login(email_b, password)
    if not token_b:
        print(f"Registering {email_b}...")
        requests.post(f"{BASE_URL}/auth/register", json=user_data_b)
        token_b = login(email_b, password)
    
    # Get User B ID
    headers_b = {"Authorization": f"Bearer {token_b}"}
    users_res = requests.get(f"{BASE_URL}/users/", headers=headers_b) # Need endpoint to get users or self?
    # Assuming /users/me works or similar. But create_shoutout needs recipient_id.
    # We can use a known ID or fetch list.
    # Let's assume User B is the last created one or find by email if we add listing endpoint.
    # For now, let's just use ID 1 (User A) as recipient for User A (self shoutout) or try to guess.
    # Or implement GET /users to find B.
    
    # Let's post a shoutout from A to A for simplicity if we can't find B's ID easily without listing.
    # Wait, Week 3 added tagging. Maybe I can't easily find ID. 
    # Logic: Login as B, decode token or /users/me to get ID?
    res_me = requests.get(f"{BASE_URL}/users/me", headers=headers_b)
    if res_me.status_code == 200:
        id_b = res_me.json()['id']
    else:
        print("Failed to get User B ID")
        return

    # 3. User A posts shoutout to B
    headers_a = {"Authorization": f"Bearer {token_a}"}
    shoutout_data = {
        "message": "Great job on the deployment!",
        "recipient_ids": [id_b]
    }
    
    print("Posting shoutout...")
    res_post = requests.post(f"{BASE_URL}/shoutouts/", json=shoutout_data, headers=headers_a)
    if res_post.status_code == 200:
        print("Shoutout posted.")
    else:
        print("Failed to post shoutout:", res_post.text)
        return

    # 4. Verify Feed
    print("Fetching Feed...")
    res_feed = requests.get(f"{BASE_URL}/shoutouts/", headers=headers_a)
    feed = res_feed.json()
    print(f"Feed count: {len(feed)}")
    if len(feed) > 0:
        item = feed[0]
        print("Latest item:", item)
        if 'sender' in item and 'recipients' in item:
            print("Expanded fields present.")
        else:
            print("ERROR: Expanded fields missing.")
            
    # 5. Verify Filter
    print("Testing Filter (Department=Sales)...")
    res_filter = requests.get(f"{BASE_URL}/shoutouts/?department=Sales", headers=headers_a)
    try:
        filtered = res_filter.json()
        print(f"Filtered count: {len(filtered)}")
    except Exception as e:
        print(f"Filter Failed. Status: {res_filter.status_code}, Response: {res_filter.text}")
        return

    # Should Include our post (Sender A is Sales)
    
    print("Testing Filter (Department=Marketing)...") # Should be empty
    res_filter_empty = requests.get(f"{BASE_URL}/shoutouts/?department=Marketing", headers=headers_a)
    try:
        filtered_empty = res_filter_empty.json()
        print(f"Empty Filter count: {len(filtered_empty)}")
    except Exception as e:
        print(f"Filter Empty Failed. Status: {res_filter_empty.status_code}, Response: {res_filter_empty.text}")
        return

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json()['access_token']
    return None

if __name__ == "__main__":
    test_week4()
