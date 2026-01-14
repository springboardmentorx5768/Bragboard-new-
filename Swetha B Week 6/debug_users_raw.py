import sqlite3

def check_users_raw():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, department, joined_at FROM users")
    rows = cursor.fetchall()
    print(f"Total rows: {len(rows)}")
    for row in rows:
        print(row)
    conn.close()

if __name__ == "__main__":
    check_users_raw()
