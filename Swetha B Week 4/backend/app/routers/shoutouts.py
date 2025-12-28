from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session, aliased
from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user
from datetime import datetime

router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])

@router.get("/", response_model=list[schemas.ShoutOutOut])
def read_shoutouts(
    department: str | None = None,
    sender_id: int | None = None,
    date_start: datetime | None = None,
    date_end: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ShoutOut).join(models.User, models.ShoutOut.sender_id == models.User.id)
    
    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)
    
    if department:
        # Filter where sender is in department OR any recipient is in department
        RecipientUser = aliased(models.User)
        query = query.outerjoin(models.ShoutOutRecipient).outerjoin(RecipientUser, models.ShoutOutRecipient.recipient_id == RecipientUser.id)
        query = query.filter(
            (models.User.department == department) | 
            (RecipientUser.department == department)
        )
    
    if date_start:
        query = query.filter(models.ShoutOut.created_at >= date_start)
    if date_end:
        query = query.filter(models.ShoutOut.created_at <= date_end)
    
    shoutouts = query.order_by(models.ShoutOut.created_at.desc()).all()
    return shoutouts

@router.post("/", response_model=schemas.ShoutOutOut)
def create_shoutout(
    message: str = Form(...),
    recipient_ids: list[str] = Form(None), # Accept as strings and optional to handle validation manually
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not recipient_ids:
         raise HTTPException(status_code=400, detail="At least one recipient must be selected")

    # Verify recipients exist
    recipients = []
    for r_id in recipient_ids:
        try:
            recipient_id = int(r_id)
        except ValueError:
             raise HTTPException(status_code=400, detail=f"Invalid recipient ID: {r_id}")
             
        user = db.query(models.User).filter(models.User.id == recipient_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {recipient_id} not found")
        recipients.append(user)
    
    image_url = None
    if file:
        import shutil
        import os
        import uuid
        
        # Ensure uploads directory exists (safety check, though main.py should have created it)
        UPLOAD_DIR = "uploads"
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
            
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Store relative URL
        image_url = f"/uploads/{filename}"
    
    # Create shoutout
    db_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=message,
        image_url=image_url
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

@router.delete("/{shoutout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    if shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this shoutout")
    
    # Check for recipients if cascade is not set up, but usually sqlalchemy handles logic or we delete manually.
    # The models show relationships. If cascade is not set on DB level, verify manual cleanup.
    # However, for simplicity and assuming basic setup, we just delete the shoutout.
    # We might need to delete from association table shoutout_recipients manually if cascade is missing.
    # Let's check models again quickly, or safeguard by deleting recipients first.
    db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.shoutout_id == shoutout_id).delete()
    
    db.delete(shoutout)
    db.commit()
    return None
