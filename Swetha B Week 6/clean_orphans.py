import sqlite3

def clean_orphans():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    
    # 1. Delete shoutouts where sender is missing
    cursor.execute("DELETE FROM shoutouts WHERE sender_id NOT IN (SELECT id FROM users)")
    print(f"Deleted {cursor.rowcount} orphaned shoutouts (missing sender).")
    
    # 2. Delete recipients where user is missing
    cursor.execute("DELETE FROM shoutout_recipients WHERE recipient_id NOT IN (SELECT id FROM users)")
    print(f"Deleted {cursor.rowcount} orphaned recipients (missing user).")

    # 3. Delete recipients where shoutout is missing
    cursor.execute("DELETE FROM shoutout_recipients WHERE shoutout_id NOT IN (SELECT id FROM shoutouts)")
    print(f"Deleted {cursor.rowcount} orphaned recipients (missing shoutout).")
    
    # 4. Delete reactions where user is missing
    cursor.execute("DELETE FROM reactions WHERE user_id NOT IN (SELECT id FROM users)")
    print(f"Deleted {cursor.rowcount} orphaned reactions (missing user).")

    # 5. Delete reactions where shoutout is missing
    cursor.execute("DELETE FROM reactions WHERE shoutout_id NOT IN (SELECT id FROM shoutouts)")
    print(f"Deleted {cursor.rowcount} orphaned reactions (missing shoutout).")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    clean_orphans()
