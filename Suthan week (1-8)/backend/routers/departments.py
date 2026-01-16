from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"]
)

@router.get("/", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(models.Department).all()
    return departments

@router.get("/colleagues", response_model=List[schemas.UserResponse])
def get_colleagues(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.department_id:
        return []
    
    users = db.query(models.User).filter(
        models.User.department_id == current_user.department_id,
        models.User.id != current_user.id # Exclude self
    ).all()
    return users

