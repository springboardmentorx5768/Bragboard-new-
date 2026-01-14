import requests
import sqlite3

def get_token():
    # Login to get valid token
    # Using 'laura123@gmail.com' / 'password123' as seen in seed data? 
    # Or I should pick a user from DB.
    try:
        conn = sqlite3.connect('backend/bragboard.db')
        cursor = conn.cursor()
        cursor.execute("SELECT email, password FROM users LIMIT 1")
        user = cursor.fetchone()
        conn.close()
        
        email = user[0]
        # Previously we saw passwords are hashed, so I can't login with DB data unless I know the plain password.
        # But 'seed_users.py' (which I didn't write but saw referenced? No I wrote seed_users.py!)
        # In seed_users.py, passwords were "password123".
        # Let's try to login as 'test_user_0' or whatever exists.
        # Check users first.
        pass
    except:
        pass
    
    # Just try login with known credentials if possible.
    # Otherwise, I can fetch public data? No, endpoint is protected.
    
    # I'll try to find a known user.
    return None

def test_api():
    # Assuming I can login. If not, I can disable auth dependency properly 
    # OR simpler: Login as the user I created in verification scripts? "Caroline"?
    
    url = "http://localhost:8000/auth/token"
    # Try a common one
    payload = {"username": "laura123@gmail.com", "password": "password123"}
    try:
        resp = requests.post(url, data=payload)
        if resp.status_code == 200:
            token = resp.json()['access_token']
            print("Login Successful.")
            
            headers = {"Authorization": f"Bearer {token}"}
            shoutouts_resp = requests.get("http://localhost:8000/shoutouts/", headers=headers)
            print(f"Shoutouts Status: {shoutouts_resp.status_code}")
            print(f"Shoutouts Data: {shoutouts_resp.text}")
        else:
            print("Login Failed: ", resp.text)
            
            # If login failed, check users in DB to find a valid email
            conn = sqlite3.connect('backend/bragboard.db')
            cursor = conn.cursor()
            cursor.execute("SELECT email FROM users LIMIT 5")
            print("Emails in DB:", cursor.fetchall())
            conn.close()
            
    except Exception as e:
        print(e)

if __name__ == "__main__":
    test_api()
