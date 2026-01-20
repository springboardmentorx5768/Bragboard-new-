import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from .. import models, database, security

router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_shoutout(
    message: str = Form(...),              # 👈 Received via Form Data
    recipient_ids: str = Form(...),        # 👈 Received as JSON string
    file: Optional[UploadFile] = File(None), # 👈 Optional file
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    # Parse the recipient list from string
    try:
        r_ids = json.loads(recipient_ids)
    except:
        raise HTTPException(status_code=400, detail="recipient_ids must be a JSON list")

    attachment_url = None
    if file:
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment_url = f"/uploads/{file.filename}"

    new_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=message,
        attachment_url=attachment_url
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)

    for r_id in r_ids:
        db.add(models.ShoutOutRecipient(shoutout_id=new_shoutout.id, recipient_id=r_id))
    
    db.commit()
    return {"message": "🎉 Success!", "shoutout_id": new_shoutout.id}

@router.get("/", response_model=List[dict])
def get_shoutouts(
    db: Session = Depends(database.get_db), 
    recipient_id: Optional[int] = None,
    sender_id: Optional[int] = None,
    department: Optional[str] = None,
    date: Optional[str] = None
):
    query = db.query(models.ShoutOut)
    
    if recipient_id:
        query = query.join(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.recipient_id == recipient_id)
    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)
    if department:
        query = query.join(models.User, models.ShoutOut.sender_id == models.User.id).filter(models.User.department == department)
    if date:
        query = query.filter(func.date(models.ShoutOut.created_at) == date)
    
    shoutouts = query.order_by(models.ShoutOut.created_at.desc()).all()
    results = []

    for s in shoutouts:
        recipient_names = [r.recipient.name for r in s.recipients if r.recipient]
        results.append({
            "id": s.id,
            "message": s.message,
            "sender_name": s.sender.name,
            "sender_id": s.sender_id,
            "recipient_names": recipient_names,
            "attachment_url": s.attachment_url, # 👈 Send URL to frontend
            "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else None 
        })
    return results

# ... (delete_shoutout and get_taggable_users remain unchanged)
def delete_shoutout(
    shoutout_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """Deletes a shoutout and its recipient links."""
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shout-out not found")
        
    if shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this shout-out")
        
    # Delete recipient links first
    db.query(models.ShoutOutRecipient).filter(
        models.ShoutOutRecipient.shoutout_id == shoutout_id
    ).delete()
    
    db.delete(shoutout)
    db.commit()
    return None

@router.get("/users", response_model=List[dict])
def get_taggable_users(db: Session = Depends(database.get_db)):
    """Returns a list of all users for tagging or filtering purposes."""
    users = db.query(models.User).all()
    return [
        {"id": user.id, "name": user.name, "department": user.department} 
        for user in users
    ]