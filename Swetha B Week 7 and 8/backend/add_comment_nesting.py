
import sqlite3

# Database file path
DB_FILE = "bragboard.db"

def add_parent_id_column():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(comments)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "parent_id" not in columns:
            print("Adding 'parent_id' column to 'comments' table...")
            # Add parent_id column allowing NULL values
            cursor.execute("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id)")
            conn.commit()
            print("Successfully added 'parent_id' column.")
        else:
            print("'parent_id' column already exists.")
            
        conn.close()
        
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_parent_id_column()
