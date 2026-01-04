import sqlalchemy
from sqlalchemy import create_engine, text

# Connection string from database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:suthan06@localhost:5432/bragboard"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def add_viewed_field():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Add viewed field to shoutout_recipients
            try:
                connection.execute(text("ALTER TABLE shoutout_recipients ADD COLUMN viewed VARCHAR DEFAULT 'false';"))
                print("Added viewed column to shoutout_recipients")
            except Exception as e:
                print(f"Viewed column add failed (maybe exists): {e}")
            
            # Update existing records to have viewed = 'false'
            try:
                connection.execute(text("UPDATE shoutout_recipients SET viewed = 'false' WHERE viewed IS NULL;"))
                print("Updated existing records to have viewed = 'false'")
            except Exception as e:
                print(f"Update existing records failed: {e}")
            
            trans.commit()
            print("Database patch completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Transaction failed: {e}")

if __name__ == "__main__":
    add_viewed_field()

