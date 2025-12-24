from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/shoutouts",
    tags=["shoutouts"]
)

@router.post("/", response_model=schemas.ShoutOutResponse)
def create_shoutout(
    shoutout: schemas.ShoutOutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Create ShoutOut
    new_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=shoutout.message
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)

    # Add recipients
    for recipient_id in shoutout.recipient_ids:
        # Validate recipient exists
        recipient = db.query(models.User).filter(models.User.id == recipient_id).first()
        if not recipient:
            continue # Optionally handle invalid recipient IDs
        
        new_recipient = models.ShoutOutRecipient(
            shoutout_id=new_shoutout.id,
            recipient_id=recipient_id
        )
        db.add(new_recipient)
    
    db.commit()
    
    return new_shoutout
