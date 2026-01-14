
import requests
import sys

BASE_URL = "http://localhost:8000"

def login(email, password):
    # The /auth/login endpoint expects JSON with "email" and "password"
    response = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
    return response.json()["access_token"]

def main():
    # Login as Swetha (assuming she exists from seed or previous tasks, or use a known user)
    # If not sure, I'll try to use a test user or create one.
    # Let's try a standard user if we know one, otherwise I might need to look at users_list.txt
    # From previous context, Swetha usually exists.
    email = "swetha@example.com"
    password = "password123" 
    
    # Try one login
    try:
        token = login(email, password)
    except:
        # If default fails, try to find a user or register one
        print("Default login failed, trying to register temp user for test...")
        email = "comment_tester@example.com"
        password = "password123"
        requests.post(f"{BASE_URL}/auth/register", json={
            "name": "Comment Tester",
            "email": email,
            "password": password,
            "department": "Engineering"
        })
        token = login(email, password)

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a shoutout
    print("Creating shoutout...")
    shoutout_data = {
        "message": "Testing comments feature!",
        "recipient_ids": ["1"] # Assuming user 1 exists, usually seed creates some. If not, self-shoutout might fail validation depending on logic but let's try.
        # Actually logic says recipients must be valid users. User 1 usually exists.
    }
    # To be safe, get users first to find a valid recipient ID
    users_resp = requests.get(f"{BASE_URL}/users/", headers=headers)
    if users_resp.status_code == 200 and users_resp.json():
        recipient_id = str(users_resp.json()[0]['id'])
        shoutout_data['recipient_ids'] = [recipient_id]
    else:
        print("Could not fetch users to shoutout to.")
        return

    resp = requests.post(f"{BASE_URL}/shoutouts/", data=shoutout_data, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to create shoutout: {resp.text}")
        return
    
    shoutout_id = resp.json()["id"]
    print(f"Created shoutout {shoutout_id}")

    # 2. Add a comment
    print("Adding comment...")
    comment_data = {"content": "This is a test comment!"}
    resp = requests.post(f"{BASE_URL}/shoutouts/{shoutout_id}/comments", json=comment_data, headers=headers)
    
    if resp.status_code != 200:
        print(f"Failed to add comment: {resp.text}")
        return
    
    print("Comment added successfully.")
    comment_json = resp.json()
    print(f"Comment response: {comment_json}")

    # 3. Verify comment appears in shoutout list
    print("Verifying shoutout details...")
    resp = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    shoutouts = resp.json()
    
    found = False
    for s in shoutouts:
        if s['id'] == shoutout_id:
            print(f"Found shoutout {shoutout_id}. Comments: {len(s['comments'])}")
            if len(s['comments']) > 0 and s['comments'][0]['content'] == "This is a test comment!":
                print("SUCCESS: Comment found in shoutout list.")
                # Check user details
                if 'user' in s['comments'][0] and s['comments'][0]['user']:
                    print(f"SUCCESS: Comment has user details: {s['comments'][0]['user']['name']}")
                else:
                    print("WARNING: Comment missing user details in list view.")
                found = True
            break
    
    if not found:
        print("ERROR: Shoutout or comment not found in list.")

if __name__ == "__main__":
    main()
