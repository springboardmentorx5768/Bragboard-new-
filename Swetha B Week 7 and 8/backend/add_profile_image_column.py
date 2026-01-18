import sqlite3

DB_FILE = "bragboard.db"

def add_profile_image_column():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "profile_image_url" not in columns:
            print("Adding profile_image_url column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_url VARCHAR")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column profile_image_url already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_profile_image_column()
