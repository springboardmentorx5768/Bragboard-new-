# backend/app/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.role is not None:
        current_user.role = user_update.role
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/", response_model=list[schemas.UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.delete("/me", status_code=204)
def delete_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Delete related data manually to be safe (no cascade assumed)
    
    # 1. Delete reactions by user
    db.query(models.Reaction).filter(models.Reaction.user_id == current_user.id).delete()
    
    # 2. Delete comments by user
    db.query(models.Comment).filter(models.Comment.user_id == current_user.id).delete()
    
    # 3. Delete recipients entries where user is recipient
    db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.recipient_id == current_user.id).delete()
    
    # 4. Delete reports by user
    db.query(models.Report).filter(models.Report.reported_by == current_user.id).delete()

    # 5. Delete shoutouts sent by user (and their related data)
    # First get shoutout IDs
    shoutouts = db.query(models.ShoutOut).filter(models.ShoutOut.sender_id == current_user.id).all()
    for s in shoutouts:
        # Delete reactions to this shoutout
        db.query(models.Reaction).filter(models.Reaction.shoutout_id == s.id).delete()
        # Delete recipients of this shoutout
        db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.shoutout_id == s.id).delete()
        # Delete comments on this shoutout
        db.query(models.Comment).filter(models.Comment.shoutout_id == s.id).delete()
        # Delete reports on this shoutout
        db.query(models.Report).filter(models.Report.shoutout_id == s.id).delete()
        # Finally delete shoutout
        db.delete(s)
        
    # 6. Delete User
    db.delete(current_user)
    db.commit()
    return None
