from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..deps import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=List[schemas.NotificationOut])
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifications = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id)\
        .order_by(models.Notification.created_at.desc())\
        .all()
    return notifications

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = 1
    db.commit()
    return {"status": "success"}
