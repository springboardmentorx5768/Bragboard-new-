from sqlalchemy import create_engine, text
import os

DATABASE_URL = "sqlite:///./bragboard.db"

def add_columns():
    if not os.path.exists("bragboard.db"):
        print("Database not found, skipping migration.")
        return

    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check existing columns
            result = conn.execute(text("PRAGMA table_info(shoutouts)"))
            existing_columns = [row.name for row in result.fetchall()]
            
            # Add edit_count
            if "edit_count" not in existing_columns:
                print("Adding edit_count column...")
                conn.execute(text("ALTER TABLE shoutouts ADD COLUMN edit_count INTEGER DEFAULT 0"))
            else:
                print("edit_count column already exists.")

            # Add is_edited
            if "is_edited" not in existing_columns:
                print("Adding is_edited column...")
                conn.execute(text("ALTER TABLE shoutouts ADD COLUMN is_edited INTEGER DEFAULT 0"))
            else:
                print("is_edited column already exists.")
                
            # Add last_edited_at
            if "last_edited_at" not in existing_columns:
                print("Adding last_edited_at column...")
                conn.execute(text("ALTER TABLE shoutouts ADD COLUMN last_edited_at DATETIME"))
            else:
                print("last_edited_at column already exists.")
                
            print("Migration completed.")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    add_columns()
