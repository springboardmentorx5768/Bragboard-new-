import sqlite3

def delete_invalid_user():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE role NOT IN ('employee', 'admin')")
    print(f"Deleted {cursor.rowcount} rows.")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    delete_invalid_user()
