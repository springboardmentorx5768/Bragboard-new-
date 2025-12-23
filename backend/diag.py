from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import SQLALCHEMY_DATABASE_URL
import models

def diagnose():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    print("--- Database Diagnosis ---")
    
    users = session.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: {u.name} (ID: {u.id}), Email: {u.email}, Dept ID: {u.department_id}")
        
    depts = session.query(models.Department).all()
    print(f"Total Departments: {len(depts)}")
    for d in depts:
        print(f"Dept: {d.name} (ID: {d.id})")
        
    brags = session.query(models.Brag).all()
    print(f"Total Brags: {len(brags)}")
    for b in brags:
        print(f"Brag: {b.title} (ID: {b.id}), User ID: {b.user_id}, Dept ID: {b.department_id}")

    session.close()

if __name__ == "__main__":
    diagnose()
