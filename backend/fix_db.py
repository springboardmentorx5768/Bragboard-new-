from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def fix_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for video_url column in brags table...")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='brags' AND column_name='video_url'"))
        column_exists = result.fetchone()
        
        if not column_exists:
            print("Column video_url does not exist. Adding it...")
            conn.execute(text("ALTER TABLE brags ADD COLUMN video_url TEXT"))
            conn.commit()
            print("Column video_url added successfully.")
        else:
            print("Column video_url already exists.")

if __name__ == "__main__":
    fix_schema()
