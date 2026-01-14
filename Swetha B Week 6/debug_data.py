import sqlite3

def check_data():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    
    print("--- USERS ---")
    cursor.execute("SELECT id, name, email, role, department FROM users")
    users = cursor.fetchall()
    for u in users:
        print(u)
    
    print("\n--- SHOUTOUTS ---")
    cursor.execute("SELECT id, sender_id, message, created_at FROM shoutouts")
    shoutouts = cursor.fetchall()
    print(f"Total Shoutouts: {len(shoutouts)}")
    for s in shoutouts:
        print(s)
    
    conn.close()

if __name__ == "__main__":
    check_data()
