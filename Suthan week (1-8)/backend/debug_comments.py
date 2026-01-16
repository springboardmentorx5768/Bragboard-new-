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

def debug_comments(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get a shoutout ID (assuming one exists, or get list)
    res_shout = requests.get(f"{BASE_URL}/api/shoutouts/", headers=headers)
    if not res_shout.ok or not res_shout.json():
        print("No shoutouts found to comment on.")
        return
    
    shoutout_id = res_shout.json()[0]['id']
    print(f"Testing on Shoutout ID: {shoutout_id}")
    
    # 2. Create a comment
    print("Creating comment...")
    comment_payload = {
        "shoutout_id": shoutout_id,
        "content": "Test comment for debugging timestamps and dislikes."
    }
    res_comment = requests.post(f"{BASE_URL}/api/shoutouts/{shoutout_id}/comments", json=comment_payload, headers=headers)
    if not res_comment.ok:
        print(f"Failed to create comment: {res_comment.text}")
        return
    
    comment_data = res_comment.json()
    comment_id = comment_data['id']
    print(f"Comment Created. ID: {comment_id}")
    print(f"  created_at raw: {comment_data.get('created_at')}")
    
    # 3. React with 'dislike'
    print("Reacting with 'dislike'...")
    react_payload = {"type": "dislike"}
    res_react = requests.post(f"{BASE_URL}/api/shoutouts/{shoutout_id}/comments/{comment_id}/react", json=react_payload, headers=headers)
    
    if res_react.ok:
        updated_comment = res_react.json()
        print("Reaction Success.")
        print(f"  Reaction Counts: {updated_comment.get('reaction_counts')}")
        print(f"  Current User Reaction: {updated_comment.get('current_user_reaction')}")
    else:
        print(f"Reaction Failed: {res_react.status_code} {res_react.text}")

if __name__ == "__main__":
    token = get_token()
    if token:
        debug_comments(token)
