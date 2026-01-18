from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, ForeignKey, Text
from app.database import SQLALCHEMY_DATABASE_URL
import datetime

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    metadata = MetaData()
    
    # Reflect current database
    metadata.reflect(bind=engine)
    
    # 1. Create followers table
    if 'followers' not in metadata.tables:
        print("Creating followers table...")
        followers = Table(
            'followers',
            metadata,
            Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
            Column('followed_id', Integer, ForeignKey('users.id'), primary_key=True)
        )
        followers.create(bind=engine)
    else:
        print("followers table already exists.")
        
    # 2. Create user_activities table
    if 'user_activities' not in metadata.tables:
        print("Creating user_activities table...")
        user_activities = Table(
            'user_activities',
            metadata,
            Column('id', Integer, primary_key=True, index=True),
            Column('user_id', Integer, ForeignKey("users.id")),
            Column('action', String),
            Column('target_id', Integer, nullable=True),
            Column('details', String, nullable=True),
            Column('timestamp', DateTime, default=datetime.datetime.utcnow)
        )
        user_activities.create(bind=engine)
    else:
        print("user_activities table already exists.")

    # 3. Create screen_time table
    if 'screen_time' not in metadata.tables:
        print("Creating screen_time table...")
        screen_time = Table(
            'screen_time',
            metadata,
            Column('id', Integer, primary_key=True, index=True),
            Column('user_id', Integer, ForeignKey("users.id")),
            Column('date', DateTime),
            Column('duration_seconds', Integer, default=0)
        )
        screen_time.create(bind=engine)
    else:
        print("screen_time table already exists.")
        
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
