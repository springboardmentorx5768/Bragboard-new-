import sqlite3

def check():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    
    print("--- COUNTS ---")
    tables = ['users', 'shoutouts', 'notifications', 'shoutout_recipients']
    for t in tables:
        try:
            cursor.execute(f"SELECT count(*) FROM {t}")
            print(f"{t}: {cursor.fetchone()[0]}")
        except Exception as e:
            print(f"{t}: Error {e}")
            
    print("\n--- RECENT SHOUTOUTS ---")
    cursor.execute("SELECT id, message, sender_id FROM shoutouts ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    for r in rows:
        print(r)
        
    conn.close()

if __name__ == "__main__":
    check()
