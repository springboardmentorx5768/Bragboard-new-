from database import SessionLocal, engine
from sqlalchemy import text

def fix_enum():
    with engine.connect() as connection:
        # Postgres specific command to add value to enum if not exists
        # We wrap it in a transaction
        try:
           # Attempt to add 'dislike' to reactiontype enum
           # Note: This is idempotent-ish (will fail if exists, so we catch)
           connection.execute(text("ALTER TYPE reactiontype ADD VALUE 'dislike'"))
           print("Added 'dislike' to reactiontype enum.")
           connection.commit()
        except Exception as e:
           print(f"Could not add 'dislike' (might already exist): {e}")

if __name__ == "__main__":
    fix_enum()
