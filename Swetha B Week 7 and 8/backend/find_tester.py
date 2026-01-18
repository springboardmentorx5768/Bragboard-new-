import sqlite3

def find_user():
    try:
        conn = sqlite3.connect("bragboard.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, email FROM users WHERE name LIKE '%tester%' OR email LIKE '%tester%'")
        users = cursor.fetchall()
        
        if not users:
            print("No users found matching 'tester'.")
            cursor.execute("SELECT id, name, email FROM users LIMIT 10")
            all_users = cursor.fetchall()
            print("Recent users:")
            for u in all_users:
                print(u)
        else:
            for u in users:
                print(u)
                
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_user()
