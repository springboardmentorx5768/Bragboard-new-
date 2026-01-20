from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from .. import models, database, security

router = APIRouter(
    prefix="/shoutouts",
    tags=["Shoutouts"]
)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_shoutout(
    shoutout_data: dict, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    """Stores a shout-out and links it to multiple recipients."""
    if "message" not in shoutout_data or "recipient_ids" not in shoutout_data:
        raise HTTPException(
            status_code=400,
            detail="message and recipient_ids are required"
        )

    recipient_ids = shoutout_data["recipient_ids"]
    if not isinstance(recipient_ids, list) or len(recipient_ids) == 0:
        raise HTTPException(status_code=400, detail="recipient_ids must be a non-empty list")

    # 1. Create the main ShoutOut entry
    new_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=shoutout_data["message"]
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)

    # 2. Create multiple recipient links
    for r_id in recipient_ids:
        recipient_link = models.ShoutOutRecipient(
            shoutout_id=new_shoutout.id,
            recipient_id=r_id
        )
        db.add(recipient_link)
    
    db.commit()
    return {
        "message": f"🎉 Shout-out sent to {len(recipient_ids)} teammates!", 
        "shoutout_id": new_shoutout.id
    }

@router.get("/", response_model=List[dict])
def get_shoutouts(
    db: Session = Depends(database.get_db), 
    recipient_id: Optional[int] = None,
    sender_id: Optional[int] = None,      # Added sender filter
    department: Optional[str] = None,    # Added department filter
    date: Optional[str] = None           # Added date filter (YYYY-MM-DD)
):
    """Fetches shout-outs with optional multi-parameter filtering."""
    query = db.query(models.ShoutOut)
    
    # Filter by Recipient
    if recipient_id:
        query = query.join(models.ShoutOutRecipient).filter(
            models.ShoutOutRecipient.recipient_id == recipient_id
        )
    
    # Filter by Sender
    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)
        
    # Filter by Department of the Sender
    if department:
        query = query.join(models.User, models.ShoutOut.sender_id == models.User.id).filter(
            models.User.department == department
        )

    # Filter by Date (comparing only the date part of created_at)
    if date:
        query = query.filter(func.date(models.ShoutOut.created_at) == date)
    
    shoutouts = query.order_by(models.ShoutOut.created_at.desc()).all()
    results = []

    for s in shoutouts:
        # Optimization: Fetch recipient names in a single query per shoutout
        recipient_names = [
            r.recipient.name for r in s.recipients if r.recipient
        ]
        
        results.append({
            "id": s.id,
            "message": s.message,
            "sender_name": s.sender.name,
            "sender_id": s.sender_id,
            "recipient_names": recipient_names,
            "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else None 
        })
    return results

@router.delete("/{shoutout_id}", status_code=status.HTTP_204_NO_CONTENT)
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