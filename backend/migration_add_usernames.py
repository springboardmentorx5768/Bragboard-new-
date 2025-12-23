"""
Migration script to add sender_username and recipient_usernames columns to shoutouts table
and populate existing records with usernames from related User records.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

# Database connection (using the same URL as in database.py)
DATABASE_URL = "postgresql://postgres:shruti098@localhost:5432/bragboard"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def migrate():
    """Add username columns and populate existing records"""
    db: Session = SessionLocal()
    
    try:
        print("Starting migration...")
        
        # Step 1: Add new columns to shoutouts table
        print("Adding sender_username column...")
        db.execute(text("""
            ALTER TABLE shoutouts 
            ADD COLUMN IF NOT EXISTS sender_username VARCHAR;
        """))
        
        print("Adding recipient_usernames column...")
        db.execute(text("""
            ALTER TABLE shoutouts 
            ADD COLUMN IF NOT EXISTS recipient_usernames TEXT;
        """))
        
        db.commit()
        print("Columns added successfully!")
        
        # Step 2: Populate sender_username for existing records
        print("Populating sender_username for existing records...")
        db.execute(text("""
            UPDATE shoutouts 
            SET sender_username = users.name
            FROM users
            WHERE shoutouts.sender_id = users.id
            AND shoutouts.sender_username IS NULL;
        """))
        
        db.commit()
        print("Sender usernames populated!")
        
        # Step 3: Populate recipient_usernames for existing records
        print("Populating recipient_usernames for existing records...")
        db.execute(text("""
            UPDATE shoutouts
            SET recipient_usernames = (
                SELECT STRING_AGG(users.name, ', ')
                FROM shoutout_recipients
                JOIN users ON shoutout_recipients.user_id = users.id
                WHERE shoutout_recipients.shoutout_id = shoutouts.id
            )
            WHERE shoutouts.recipient_usernames IS NULL;
        """))
        
        db.commit()
        print("Recipient usernames populated!")
        
        # Step 4: Verify the migration
        result = db.execute(text("""
            SELECT COUNT(*) as total,
                   COUNT(sender_username) as with_sender,
                   COUNT(recipient_usernames) as with_recipients
            FROM shoutouts;
        """))
        
        row = result.fetchone()
        print(f"\nMigration verification:")
        print(f"Total shoutouts: {row[0]}")
        print(f"With sender_username: {row[1]}")
        print(f"With recipient_usernames: {row[2]}")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
