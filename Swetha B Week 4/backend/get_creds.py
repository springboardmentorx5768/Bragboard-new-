from app.database import SessionLocal
from app.models import User

def main():
    db = SessionLocal()
    users = db.query(User).all()
    for u in users:
        if u.name in ["TestUser1", "Admin", "Tara"]:
            print(f"User: {u.name}, Email: {u.email}")
    db.close()

if __name__ == "__main__":
    main()
