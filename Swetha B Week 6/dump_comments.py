import sqlite3
import os

def dump_all_comments():
    db_path = os.path.join('backend', 'bragboard.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, shoutout_id, parent_id, content FROM comments")
    rows = cur.fetchall()
    print("ID | ShoutOutID | ParentID | Content")
    print("-" * 40)
    for row in rows:
        print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}")
    conn.close()

if __name__ == "__main__":
    dump_all_comments()
