from sqlalchemy import create_engine, text
import os

DATABASE_URL = "sqlite:///./bragboard.db"

def add_column():
    if not os.path.exists("bragboard.db"):
        print("Database not found, skipping migration (will be created by app).")
        return

    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(shoutouts)"))
            columns = [row.name for row in result.fetchall()]
            
            if "image_url" not in columns:
                print("Adding image_url column to shoutouts table...")
                conn.execute(text("ALTER TABLE shoutouts ADD COLUMN image_url VARCHAR"))
                print("Column added successfully.")
            else:
                print("image_url column already exists.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
