from database import engine
from sqlalchemy import text

def add_profile_picture_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_picture TEXT;"))
            conn.commit()  # Use commit explicitly for some drivers
            print("Successfully added profile_picture column to users table.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    add_profile_picture_column()
