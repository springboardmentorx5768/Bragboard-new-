import requests

def test_login():
    url = "http://localhost:8000/auth/token"
    # Try with a known user (or even invalid one to check 401 vs 500)
    # I saw 'Laura' (laura123@gmail.com) in previous outputs.
    payload = {
        "username": "laura123@gmail.com",
        "password": "password123" # Assuming standard password or just checking response
    }
    
    try:
        response = requests.post(url, data=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_login()
