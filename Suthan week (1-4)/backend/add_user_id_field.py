import sqlalchemy
from sqlalchemy import create_engine, text
import random

# Connection string from database.py
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:suthan06@localhost:5432/bragboard"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def generate_unique_user_id(db_conn):
    """Generate a unique 4-digit user ID"""
    while True:
        user_id = str(random.randint(1000, 9999))
        result = db_conn.execute(text("SELECT id FROM users WHERE user_id = :user_id"), {"user_id": user_id})
        if result.first() is None:
            return user_id

def add_user_id_field():
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Add user_id field to users table
            try:
                connection.execute(text("ALTER TABLE users ADD COLUMN user_id VARCHAR(4) UNIQUE;"))
                print("Added user_id column to users")
            except Exception as e:
                print(f"user_id column add failed (maybe exists): {e}")
            
            # Create index if not exists
            try:
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);"))
                print("Created index on user_id")
            except Exception as e:
                print(f"Index creation failed: {e}")
            
            # Update existing users with unique 4-digit IDs
            try:
                result = connection.execute(text("SELECT id FROM users WHERE user_id IS NULL"))
                users_without_id = result.fetchall()
                
                for (user_db_id,) in users_without_id:
                    unique_id = generate_unique_user_id(connection)
                    connection.execute(
                        text("UPDATE users SET user_id = :user_id WHERE id = :id"),
                        {"user_id": unique_id, "id": user_db_id}
                    )
                    print(f"Assigned user_id {unique_id} to user {user_db_id}")
                
                print(f"Updated {len(users_without_id)} existing users with user_id")
            except Exception as e:
                print(f"Update existing users failed: {e}")
            
            trans.commit()
            print("Database patch completed successfully.")
        except Exception as e:
            trans.rollback()
            print(f"Transaction failed: {e}")
            raise

if __name__ == "__main__":
    add_user_id_field()

