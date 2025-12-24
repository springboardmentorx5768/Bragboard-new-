from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])

@router.post("/", response_model=schemas.ShoutOutOut)
def create_shoutout(
    shoutout: schemas.ShoutOutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify recipients exist
    recipients = []
    for recipient_id in shoutout.recipient_ids:
        user = db.query(models.User).filter(models.User.id == recipient_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {recipient_id} not found")
        recipients.append(user)
    
    # Create shoutout
    db_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=shoutout.message
    )
    db.add(db_shoutout)
    db.commit()
    db.refresh(db_shoutout)
    
    # Add recipients
    for recipient in recipients:
        db_recipient = models.ShoutOutRecipient(
            shoutout_id=db_shoutout.id,
            recipient_id=recipient.id
        )
        db.add(db_recipient)
    
    db.commit()
    db.refresh(db_shoutout)
    return db_shoutout
