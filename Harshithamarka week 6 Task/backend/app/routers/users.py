from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models
from ..database import get_db
from ..security import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])
@router.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[schemas.UserOut])
def read_users(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches all registered users from the database 
    so they can be displayed in the Teammate IDs sidebar.
    """
    users = db.query(models.User).all()
    return users
