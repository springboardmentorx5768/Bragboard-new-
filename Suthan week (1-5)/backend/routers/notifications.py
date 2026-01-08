from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get notifications for the current user, ordered by newest first"""
    notifications = db.query(models.Notification).options(
        joinedload(models.Notification.actor)
    ).filter(
        models.Notification.recipient_id == current_user.id
    ).order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications

@router.put("/{id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark a specific notification as reading"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = 'true'
    db.commit()

@router.put("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark all notifications for the current user as read"""
    db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        (models.Notification.is_read == 'false') | (models.Notification.is_read == None)
    ).update({models.Notification.is_read: 'true'}, synchronize_session=False)
    
    db.commit()
