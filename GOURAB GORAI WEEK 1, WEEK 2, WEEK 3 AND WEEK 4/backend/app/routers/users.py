# backend/app/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

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
    db.commit()
    db.refresh(current_user)
    return current_user

import shutil
import os
import uuid
from fastapi import File, UploadFile, HTTPException

UPLOAD_DIR = "uploads/profile_pics"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/me/picture", response_model=schemas.UserOut)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Access current_user.id inside the function scope where it is available
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update user profile
    # URL needs to be absolute or relative to root. Storing relative path for now.
    # Assuming the app mounts /uploads
    relative_path = f"/uploads/profile_pics/{filename}"
    current_user.profile_picture = relative_path
    
    db.commit()
    db.refresh(current_user)
    return current_user

    db.refresh(current_user)
    return current_user


@router.get("/departments", response_model=list[str])
def get_departments(db: Session = Depends(get_db)):
    """Fetch all distinct departments from users."""
    results = db.query(models.User.department).distinct().filter(models.User.department != None).all()
    # results is a list of tuples like [('Engineering',), ('Sales',)]
    return [r[0] for r in results if r[0]]  # Filter out empty strings if any


@router.get("/", response_model=list[schemas.UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # By default, only return active users for things like tagging
    users = db.query(models.User).filter(models.User.is_deleted == "false").offset(skip).limit(limit).all()
    return users

@router.get("/me/notifications", response_model=list[schemas.NotificationOut])
def read_my_notifications(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifications = db.query(models.Notification).options(
        joinedload(models.Notification.sender)
    ).filter(
        models.Notification.recipient_id == current_user.id
    ).order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications

@router.post("/me/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if notification:
        notification.is_read = "true"
        db.commit()
        return {"status": "success"}
    return {"status": "not_found"}

@router.delete("/me/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        return {"status": "success", "message": "Notification deleted"}
    
    return {"status": "not_found", "message": "Notification not found"}
