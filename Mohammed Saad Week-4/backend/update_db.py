import sqlite3

def update_database():
    try:
        # Connect to your database file
        conn = sqlite3.connect('bragboard.db')
        cursor = conn.cursor()
        
        print("Connecting to database...")
        
        # Execute the command to add the column
        cursor.execute("ALTER TABLE shoutouts ADD COLUMN attachment_url TEXT")
        
        # Save changes and close
        conn.commit()
        conn.close()
        print("✅ Success: 'attachment_url' column added to shoutouts table.")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("ℹ️ Column already exists. You are good to go!")
        else:
            print(f"❌ An error occurred: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    update_database()