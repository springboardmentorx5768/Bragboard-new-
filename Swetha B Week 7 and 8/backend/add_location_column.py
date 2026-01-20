import sqlite3

# Connect to the SQLite database
# Assuming standard FastAPI sqlite setup in the root or app folder. 
# Based on common structures, it's often 'sql_app.db' or similar. 
# I'll check the database file location first or try the most likely one 'sql_app.db' in backend root or 'app.db'.
# If the user has a specific DB path, I should find it.
# Let's try locating the db file first or just guessing 'sql_app.db' which is default for many fastapi tutorials.
# Or better, read database.py to find the URI.

DB_PATH = "bragboard.db" 

def add_column():
    try:
        conn = sqlite3.connect("bragboard.db") # Executing from backend root likely
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(shoutouts)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "location" not in columns:
            print("Adding location column...")
            cursor.execute("ALTER TABLE shoutouts ADD COLUMN location TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'location' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
