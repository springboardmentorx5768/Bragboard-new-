from sqlalchemy import text
from database import engine, SessionLocal
import models

def reset_db():
    try:
        with engine.connect() as conn:
            # Force drop all tables using raw SQL to be sure
            print("Dropping tables via raw SQL...")
            conn.execute(text("DROP TABLE IF EXISTS brags CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS departments CASCADE;"))
            conn.commit()
            
        print("Recreating tables via SQLAlchemy...")
        models.Base.metadata.create_all(bind=engine)
        print("Database reset successfully!")
        
        # Verify columns in users table
        with engine.connect() as conn:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"))
            columns = [row[0] for row in result]
            print(f"Columns in 'users' table: {columns}")
            
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_db()
