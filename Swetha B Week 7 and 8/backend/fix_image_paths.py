import sqlite3

DB_FILE = "bragboard.db"

def fix_image_paths():
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Update paths starting with /static/uploads/ to /uploads/
        cursor.execute("UPDATE users SET profile_image_url = REPLACE(profile_image_url, '/static/uploads/', '/uploads/') WHERE profile_image_url LIKE '/static/uploads/%'")
        
        print(f"Updated {conn.total_changes} records.")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_image_paths()
