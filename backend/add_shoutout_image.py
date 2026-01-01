from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def add_shoutout_image_column():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for image_url column in shoutouts table...")
        # Check if column exists
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='shoutouts' AND column_name='image_url'"))
        column_exists = result.fetchone()
        
        if not column_exists:
            print("Column image_url does not exist. Adding it...")
            try:
                conn.execute(text("ALTER TABLE shoutouts ADD COLUMN image_url TEXT"))
                conn.commit()
                print("Column image_url added successfully.")
            except Exception as e:
                print(f"Error adding column: {e}")
        else:
            print("Column image_url already exists.")

if __name__ == "__main__":
    add_shoutout_image_column()
