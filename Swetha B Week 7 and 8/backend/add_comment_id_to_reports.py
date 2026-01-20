import sqlite3

def add_column():
    conn = sqlite3.connect('bragboard.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE reports ADD COLUMN comment_id INTEGER REFERENCES comments(id)")
        print("Column comment_id added successfully.")
        conn.commit()
    except sqlite3.OperationalError as e:
        print(f"Error (likely already exists): {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
