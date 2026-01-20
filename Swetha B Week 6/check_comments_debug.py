import sqlite3
import pandas as pd

def check_comments():
    conn = sqlite3.connect('bragboard.db')
    query = "SELECT id, shoutout_id, user_id, parent_id, content FROM comments ORDER BY id DESC LIMIT 20"
    df = pd.read_sql_query(query, conn)
    print("--- RECENT COMMENTS ---")
    print(df)
    conn.close()

if __name__ == "__main__":
    check_comments()
