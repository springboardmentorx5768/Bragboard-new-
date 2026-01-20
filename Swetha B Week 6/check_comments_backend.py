import sqlite3
import pandas as pd
import os

def check_comments():
    db_path = os.path.join('backend', 'bragboard.db')
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    try:
        query = "SELECT id, shoutout_id, user_id, parent_id, content FROM comments ORDER BY id DESC LIMIT 20"
        df = pd.read_sql_query(query, conn)
        print("--- RECENT COMMENTS IN backend/bragboard.db ---")
        print(df)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_comments()
