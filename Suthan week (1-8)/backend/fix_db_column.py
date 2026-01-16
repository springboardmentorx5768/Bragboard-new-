from database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id);"))
            conn.commit()
            print("Successfully added parent_id column to comments table and COMMITTED.")
        except Exception as e:
            print(f"Error adding column: {e}")
            # Likely already exists or other error, print to debug
            pass

if __name__ == "__main__":
    add_column()
