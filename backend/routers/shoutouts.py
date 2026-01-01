from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from database import get_db
import models, schemas, auth
from typing import List, Optional
from sqlalchemy import func

router = APIRouter(
    prefix="/api/shoutouts",
    tags=["shoutouts"]
)

@router.post("/", response_model=schemas.ShoutoutResponse)
def create_shoutout(
    shoutout: schemas.ShoutoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Validate recipients exist
    recipients = db.query(models.User).filter(models.User.id.in_(shoutout.recipient_ids)).all()
    if len(recipients) != len(shoutout.recipient_ids):
        raise HTTPException(status_code=404, detail="One or more recipients not found")

    # Prepare recipient usernames
    recipient_usernames = ", ".join([r.name for r in recipients])
    
    new_shoutout = models.Shoutout(
        message=shoutout.message,
        sender_id=current_user.id,
        sender_username=current_user.name,
        recipient_usernames=recipient_usernames,
        image_url=shoutout.image_url
    )
    new_shoutout.recipients = recipients
    
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)
    
    # Create notifications for recipients
    for recipient in recipients:
        notification = models.Notification(
            user_id=recipient.id,
            message=f"{current_user.name} gave you a shout-out!",
            type="shoutout",
            source_id=new_shoutout.id
        )
        db.add(notification)
    
    # Create self-notification
    self_notification = models.Notification(
        user_id=current_user.id,
        message="You shared a shout-out!",
        type="shoutout",
        source_id=new_shoutout.id
    )
    db.add(self_notification)
    
    db.commit()
    
    return new_shoutout

@router.get("/", response_model=List[schemas.ShoutoutResponse])
def get_shoutouts(
    department_id: int = None,
    user_id: int = None,
    date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Shoutout).options(
        joinedload(models.Shoutout.sender),
        joinedload(models.Shoutout.recipients)
    )

    if department_id:
        query = query.join(models.User, models.Shoutout.sender_id == models.User.id)\
                     .filter(models.User.department_id == department_id)
    
    if user_id:
        query = query.filter(models.Shoutout.sender_id == user_id)

    if date:
        # Assuming date is in YYYY-MM-DD format
        query = query.filter(func.date(models.Shoutout.created_at) == date)

    shoutouts = query.order_by(models.Shoutout.created_at.desc()).all()
    
    return shoutouts

@router.get("/me", response_model=List[schemas.ShoutoutResponse])
def get_my_shoutouts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    shoutouts = db.query(models.Shoutout).options(
        joinedload(models.Shoutout.sender),
        joinedload(models.Shoutout.recipients)
    ).filter(
        (models.Shoutout.sender_id == current_user.id) | 
        (models.Shoutout.recipients.any(id=current_user.id))
    ).order_by(models.Shoutout.created_at.desc()).all()
    
    return shoutouts

@router.delete("/{shoutout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
    
    if shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this shout-out")
    
    # Clean up recipients (if not cascading)
    db.execute(text("DELETE FROM shoutout_recipients WHERE shoutout_id = :sid"), {"sid": shoutout_id})
    
    db.delete(shoutout)
    db.commit()
    return None

@router.put("/{shoutout_id}", response_model=schemas.ShoutoutResponse)
def update_shoutout(
    shoutout_id: int,
    shoutout_update: schemas.ShoutoutUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
    
    if shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this shout-out")
    
    if shoutout_update.message is not None:
        shoutout.message = shoutout_update.message
        
    if shoutout_update.recipient_ids is not None:
        recipients = db.query(models.User).filter(models.User.id.in_(shoutout_update.recipient_ids)).all()
        if len(recipients) != len(shoutout_update.recipient_ids):
             raise HTTPException(status_code=404, detail="One or more recipients not found")
        shoutout.recipients = recipients
        # Update recipient usernames
        shoutout.recipient_usernames = ", ".join([r.name for r in recipients])
        
        # Optionally create new notifications for new recipients 
        # (For simplicity, let's notify all current recipients that they were tagged/updated)
        for recipient in recipients:
            notification = models.Notification(
                user_id=recipient.id,
                message=f"{current_user.name} updated a shout-out tagging you!",
                type="shoutout",
                source_id=shoutout.id
            )
            db.add(notification)
            
    if shoutout_update.image_url is not None:
        shoutout.image_url = shoutout_update.image_url
            
    db.commit()
    db.refresh(shoutout)
    return shoutout
