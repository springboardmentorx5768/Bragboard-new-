import requests

BASE_URL = "http://localhost:8000"
EMAIL = "sales_user@example.com"
PASSWORD = "password123"

def debug_actions():
    # Login
    auth_res = requests.post(f"{BASE_URL}/auth/token", data={"username": EMAIL, "password": PASSWORD})
    if auth_res.status_code != 200:
        print(f"Login failed: {auth_res.text}")
        return
    token = auth_res.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch shoutouts to get an ID
    res = requests.get(f"{BASE_URL}/shoutouts/", headers=headers)
    shoutouts = res.json()
    if not shoutouts:
        print("No shoutouts to test actions on.")
        return
    
    shoutout_id = shoutouts[0]['id']
    print(f"Testing actions on Shoutout ID: {shoutout_id}")

    # Test Reaction
    print("Testing Like...")
    react_res = requests.post(
        f"{BASE_URL}/shoutouts/{shoutout_id}/reactions", 
        data={"type": "like"},
        headers=headers
    )
    if react_res.status_code == 200:
        print("Like success:", react_res.json())
    else:
        print("Like failed:", react_res.text)

    # Test Delete (Only works if sender matches)
    # create a self-shoutout to delete
    print("Creating temporary shoutout to delete...")
    create_res = requests.post(
        f"{BASE_URL}/shoutouts/",
        data={"message": "Temp delete me", "recipient_ids": [str(shoutouts[0]['sender']['id'])]}, # send to whoever
        headers=headers
    )
    if create_res.status_code == 200:
        temp_id = create_res.json()['id']
        print(f"Created temp shoutout {temp_id}. Deleting...")
        del_res = requests.delete(f"{BASE_URL}/shoutouts/{temp_id}", headers=headers)
        if del_res.status_code == 204:
            print("Delete success.")
        else:
            print("Delete failed:", del_res.text)
    else:
        print("Create temp failed:", create_res.text)

if __name__ == "__main__":
    debug_actions()
