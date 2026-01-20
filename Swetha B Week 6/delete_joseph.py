import sqlite3

def delete_joseph():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    
    name_to_delete = "Joseph"
    print(f"Looking for user '{name_to_delete}'...")
    
    cursor.execute("SELECT id FROM users WHERE name = ?", (name_to_delete,))
    user = cursor.fetchone()
    
    if not user:
        print(f"User '{name_to_delete}' not found.")
        return

    user_id = user[0]
    print(f"Found user ID: {user_id}. Deleting related data...")

    # 1. Delete reactions by user
    cursor.execute("DELETE FROM reactions WHERE user_id = ?", (user_id,))
    print(f"- Deleted {cursor.rowcount} reactions by user.")

    # 2. Delete comments by user
    cursor.execute("DELETE FROM comments WHERE user_id = ?", (user_id,))
    print(f"- Deleted {cursor.rowcount} comments by user.")

    # 3. Delete recipients entries where user is recipient
    cursor.execute("DELETE FROM shoutout_recipients WHERE recipient_id = ?", (user_id,))
    print(f"- Deleted {cursor.rowcount} shoutout receipts for user.")

    # 4. Delete reports by user
    cursor.execute("DELETE FROM reports WHERE reported_by = ?", (user_id,))
    print(f"- Deleted {cursor.rowcount} reports filed by user.")

    # 5. Delete shoutouts sent by user (and their related data)
    # Get IDs of shoutouts sent by user
    cursor.execute("SELECT id FROM shoutouts WHERE sender_id = ?", (user_id,))
    shoutout_ids = [row[0] for row in cursor.fetchall()]
    
    if shoutout_ids:
        ids_tuple = tuple(shoutout_ids)
        # SQLite needs (id,) for single item tuple in IN clause syntax or simple list
        # For simple reliable deletion loop:
        for sid in shoutout_ids:
            cursor.execute("DELETE FROM reactions WHERE shoutout_id = ?", (sid,))
            cursor.execute("DELETE FROM shoutout_recipients WHERE shoutout_id = ?", (sid,))
            cursor.execute("DELETE FROM comments WHERE shoutout_id = ?", (sid,))
            cursor.execute("DELETE FROM reports WHERE shoutout_id = ?", (sid,))
            cursor.execute("DELETE FROM shoutouts WHERE id = ?", (sid,))
        print(f"- Deleted {len(shoutout_ids)} shoutouts sent by user (and their related data).")

    # 6. Delete User
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    print(f"- Deleted user record.")

    conn.commit()
    conn.close()
    print("Deletion complete.")

if __name__ == "__main__":
    delete_joseph()
