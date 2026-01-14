import requests

url = "http://localhost:8000/shoutouts/"
# Need a valid token. Since I can't easily get the browser's token, 
# I'll rely on the existing auth or login first.
# For simplicity, I will assume I can fix the code without running this OR login first.

# Let's try to login first to get a token
login_url = "http://localhost:8000/auth/token"
data = {"username": "testuser123@gmail.com", "password": "password123"}
response = requests.post(login_url, data=data)
print(f"Login Status: {response.status_code}")
if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test Payload
    # Note: recipient_ids is a list. In requests, we pass it as a list of tuples or just list in data?
    # requests handles list in data for form-url-encoded, but for multipart?
    
    # Correct way for requests multipart with list values:
    multipart_data = [
        ('message', (None, 'Hello World')),
        ('recipient_ids', (None, '1')),
        ('recipient_ids', (None, '2')),
    ]
    files = {
        'file': ('test.txt', b'test content', 'text/plain')
    }
    
    # Try sending
    resp = requests.post(url, headers=headers, files=files, data={'message': 'Hello', 'recipient_ids': [1, 2]})
    # Wait, requests data/files mixing is tricky.
    # If we use `data` with list, requests handles it?
    
    resp = requests.post(url, headers=headers, data={'message': 'Hello', 'recipient_ids': [1, 2]}, files=files)
    
    print(f"Create Status: {resp.status_code}")
    print(f"Create Response: {resp.text}")
else:
    print("Login failed")
