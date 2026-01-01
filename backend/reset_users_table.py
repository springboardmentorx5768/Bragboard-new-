from database import engine, Base
from models import User

print("Dropping Users table...")
User.__table__.drop(engine)

print("Recreating Users table...")
User.__table__.create(engine)

print("Done.")
