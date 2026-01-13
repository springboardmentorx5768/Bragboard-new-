from database import engine, Base
import models

def update_schema():
    print("Updating database schema...")
    Base.metadata.create_all(bind=engine)
    print("Database schema updated successfully.")

if __name__ == "__main__":
    update_schema()
