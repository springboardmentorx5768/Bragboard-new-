import sqlite3

def enable_wal():
    db_path = 'backend/bragboard.db'
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current journal mode
        cursor.execute("PRAGMA journal_mode;")
        current = cursor.fetchone()[0]
        print(f"Current journal mode: {current}")
        
        # Set to WAL
        cursor.execute("PRAGMA journal_mode=WAL;")
        new_mode = cursor.fetchone()[0]
        print(f"New journal mode: {new_mode}")
        
        conn.close()
        print("Successfully enabled WAL mode.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    enable_wal()
