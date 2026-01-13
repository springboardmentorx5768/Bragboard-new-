import sqlalchemy
from sqlalchemy import create_engine, text

# Connection string from database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:suthan06@localhost:5432/bragboard"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def fix_db():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Add title
            try:
                connection.execute(text("ALTER TABLE shoutouts ADD COLUMN title VARCHAR;"))
                print("Added title column")
            except Exception as e:
                print(f"Title add failed (maybe exists): {e}")

            # Add image_url
            try:
                connection.execute(text("ALTER TABLE shoutouts ADD COLUMN image_url TEXT;"))
                print("Added image_url column")
            except Exception as e:
                print(f"image_url add failed (maybe exists): {e}")

            # Add tags
            try:
                connection.execute(text("ALTER TABLE shoutouts ADD COLUMN tags VARCHAR;"))
                print("Added tags column")
            except Exception as e:
                print(f"tags add failed (maybe exists): {e}")
            
            trans.commit()
            print("Database patch completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Transaction failed: {e}")

if __name__ == "__main__":
    fix_db()
