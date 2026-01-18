# backend/app/routers/users.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/me/stats", response_model=dict)
def read_my_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Counts
    shoutouts_sent_count = db.query(models.ShoutOut).filter(models.ShoutOut.sender_id == current_user.id).count()
    
    # Shoutouts received count (via recipients table)
    shoutouts_received_count = db.query(models.ShoutOutRecipient).filter(
        models.ShoutOutRecipient.recipient_id == current_user.id
    ).count()
    
    # Recent Sent (Join recipients to get names)
    recent_sent_query = db.query(models.ShoutOut).filter(
        models.ShoutOut.sender_id == current_user.id
    ).order_by(models.ShoutOut.created_at.desc()).limit(5).all()
    
    recent_sent = []
    for s in recent_sent_query:
        # Determine display name for recipients
        recipient_names = [r.recipient.name for r in s.recipients if r.recipient]
        recipients_display = ", ".join(recipient_names) if recipient_names else "No one"
        recent_sent.append({
            "id": s.id,
            "message": s.message,
            "date": s.created_at,
            "recipients": recipients_display
        })

    # Recent Received
    recent_received_query = db.query(models.ShoutOut).join(models.ShoutOutRecipient).filter(
        models.ShoutOutRecipient.recipient_id == current_user.id
    ).order_by(models.ShoutOut.created_at.desc()).limit(5).all()
    
    recent_received = []
    for s in recent_received_query:
        recent_received.append({
            "id": s.id,
            "message": s.message,
            "date": s.created_at,
            "sender": s.sender.name if s.sender else "Unknown"
        })

    return {
        "shoutouts_sent": shoutouts_sent_count,
        "shoutouts_received": shoutouts_received_count,
        "recent_sent": recent_sent,
        "recent_received": recent_received
    }

@router.post("/upload-avatar", response_model=schemas.UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import shutil
    import os
    from uuid import uuid4
    
    # Ensure uploads exists
    UPLOAD_DIR = "uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    # Valid extensions
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    # Generate unique filename
    filename = f"{uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Update user profile
    # URL path to be used by frontend
    url_path = f"/uploads/{filename}"
    
    current_user.profile_image_url = url_path
    db.commit()
    db.refresh(current_user)
    
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

@router.get("/{user_id}", response_model=schemas.UserOut)
def read_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Follow logic removed per user request
    
    return user
