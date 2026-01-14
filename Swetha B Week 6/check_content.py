import sqlite3
import pandas as pd

def check_db():
    conn = sqlite3.connect('backend/bragboard.db')
    try:
        print("--- USERS ---")
        users = pd.read_sql_query("SELECT id, name, email FROM users", conn)
        print(users)
        
        print("\n--- SHOUTOUTS ---")
        shoutouts = pd.read_sql_query("SELECT id, sender_id, message, created_at FROM shoutouts", conn)
        print(shoutouts)
        
        print("\n--- NOTIFICATIONS ---")
        try:
            notifs = pd.read_sql_query("SELECT * FROM notifications", conn)
            print(notifs)
        except:
            print("Notifications table likely missing or empty")
            
    except Exception as e:
        print(e)
    finally:
        conn.close()

if __name__ == "__main__":
    check_db()
