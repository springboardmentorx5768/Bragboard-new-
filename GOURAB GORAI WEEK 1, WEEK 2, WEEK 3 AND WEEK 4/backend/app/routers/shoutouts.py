from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
import shutil
import uuid
import os
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])

@router.get("/settings")
def get_shoutout_settings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    settings = db.query(models.SystemSetting).filter(models.SystemSetting.key.in_(["allow_reactions", "allow_comments", "completed_weeks"])).all()
    result = {"allow_reactions": "true", "allow_comments": "true", "completed_weeks": "4"}
    for s in settings:
        result[s.key] = s.value
    return result

@router.post("/settings/completed_weeks")
def update_completed_weeks(
    weeks: int = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update project status")
    
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "completed_weeks").first()
    if not setting:
        setting = models.SystemSetting(key="completed_weeks", value=str(weeks))
        db.add(setting)
    else:
        setting.value = str(weeks)
    
    db.commit()
    return {"completed_weeks": weeks}

@router.post("/", response_model=schemas.ShoutOutOut)
def create_shoutout(

    message: str = Form(...),

    recipient_ids: List[int] = Form([]),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Create the shoutout
    db_shoutout = models.ShoutOut(
        sender_id=current_user.id,
        message=message
    )
    db.add(db_shoutout)
    db.commit()
    db.refresh(db_shoutout)

    # Handle file uploads
    if files:
        for file in files:
            # Determine media type
            media_type = None
            if file.content_type.startswith("image/"):
                media_type = models.MediaType.IMAGE
            elif file.content_type.startswith("video/"):
                media_type = models.MediaType.VIDEO
            
            if media_type:
                # Generate unique filename
                file_ext = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_ext}"
                file_path = f"uploads/{unique_filename}"
                
                # Save file
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                # Create ShoutOutMedia entry
                db_media = models.ShoutOutMedia(
                    shoutout_id=db_shoutout.id,
                    file_path=file_path,
                    media_type=media_type
                )
                db.add(db_media)

    # Add recipients
    for recipient_id in recipient_ids:
        # Verify recipient exists
        recipient = db.query(models.User).filter(models.User.id == recipient_id).first()
        if not recipient:
            continue
        
        db_recipient = models.ShoutOutRecipient(
            shoutout_id=db_shoutout.id,
            recipient_id=recipient_id
        )
        db.add(db_recipient)

        # Create Notification for Tag
        notification = models.Notification(
            recipient_id=recipient_id,
            sender_id=current_user.id,
            shoutout_id=db_shoutout.id,
            type="tag",
            message=f"{current_user.name} tagged you in a shoutout!",
            is_read="false"
        )
        db.add(notification)
    
    db.commit()
    
    # Reload with relationships for response
    shoutout_with_rels = db.query(models.ShoutOut).options(
        joinedload(models.ShoutOut.sender),
        joinedload(models.ShoutOut.recipients).joinedload(models.ShoutOutRecipient.recipient),
        joinedload(models.ShoutOut.media)
    ).filter(models.ShoutOut.id == db_shoutout.id).first()
    
    return shoutout_with_rels

@router.put("/{shoutout_id}", response_model=schemas.ShoutOutOut)
def update_shoutout(
    shoutout_id: int,
    shoutout_update: schemas.ShoutOutUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_shoutout = db.get(models.ShoutOut, shoutout_id)
    if not db_shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
        
    if db_shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this shoutout")
        
    db_shoutout.message = shoutout_update.message
    db.commit()
    db.refresh(db_shoutout)
    
    # Reload with relationships for response
    shoutout_with_rels = db.query(models.ShoutOut).options(
        joinedload(models.ShoutOut.sender),
        joinedload(models.ShoutOut.recipients).joinedload(models.ShoutOutRecipient.recipient),
        joinedload(models.ShoutOut.reactions),
        joinedload(models.ShoutOut.comments).joinedload(models.Comment.user),
        joinedload(models.ShoutOut.media)
    ).filter(models.ShoutOut.id == db_shoutout.id).first()
    
    return shoutout_with_rels

@router.get("/", response_model=list[schemas.ShoutOutOut])
def read_shoutouts(
    skip: int = 0, 
    limit: int = 100, 
    department: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check feed visibility setting
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "feed_visible").first()
    is_visible = setting.value == "true" if setting else True
    
    # If feed is hidden and user is not admin, return empty list
    # EXCEPTION: If user is requesting their own posts, allow it even if feed is hidden
    if not is_visible and (not user_id or user_id != current_user.id):
        return []

    query = db.query(models.ShoutOut).options(
        joinedload(models.ShoutOut.sender),
        joinedload(models.ShoutOut.recipients).joinedload(models.ShoutOutRecipient.recipient),
        joinedload(models.ShoutOut.reactions),
        joinedload(models.ShoutOut.comments).joinedload(models.Comment.user),
        joinedload(models.ShoutOut.media)
    )
    
    if user_id:
        query = query.filter(models.ShoutOut.sender_id == user_id)
    
    if department:
        query = query.join(models.User, models.ShoutOut.sender_id == models.User.id).filter(models.User.department == department)
        
    shoutouts = query.order_by(models.ShoutOut.created_at.desc()).offset(skip).limit(limit).all()
    return shoutouts

@router.post("/{shoutout_id}/react", response_model=schemas.ReactionOut)
def react_to_shoutout(
    shoutout_id: int,
    reaction: schemas.ReactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if reactions are allowed
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "allow_reactions").first()
    if setting and setting.value == "false":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Reactions are currently disabled by the administrator"
        )

    # Check if shoutout exists
    shoutout = db.get(models.ShoutOut, shoutout_id)
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    # Check for existing reaction by this user on this shoutout
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == shoutout_id,
        models.Reaction.user_id == current_user.id
    ).first()

    if existing_reaction:
        # If same type, toggle off (delete)
        if existing_reaction.type == reaction.type:
            db.delete(existing_reaction)
            db.commit()
            # Return dummy deleted reaction to indicate removal, or handle on frontend
            # For simplicity, returning the deleted reaction object state
            return existing_reaction 
        else:
            # Change reaction type
            existing_reaction.type = reaction.type
            db.commit()
            db.refresh(existing_reaction)
            return existing_reaction
    else:
        # Create new reaction
        new_reaction = models.Reaction(
            shoutout_id=shoutout_id,
            user_id=current_user.id,
            type=reaction.type
        )
        db.add(new_reaction)
        db.commit()
        db.refresh(new_reaction)

        # Create Notification for Reaction
        if shoutout.sender_id != current_user.id:
            # Check if reaction notification already exists to avoid spam? 
            # For now, let's just create it. Or maybe we only notify on the first one?
            # Simple approach: Every reaction notifies.
            
            notification_type = f"reaction_{reaction.type.value}"
            notification_msg = f"{current_user.name} reacted with {reaction.type.value} to your shoutout!"

            notification = models.Notification(
                recipient_id=shoutout.sender_id,
                sender_id=current_user.id,
                shoutout_id=shoutout.id,
                type=notification_type,
                message=notification_msg,
                is_read="false"
            )
            db.add(notification)
            db.commit()

        return new_reaction

@router.post("/{shoutout_id}/comments", response_model=schemas.CommentOut)
def add_comment(
    shoutout_id: int,
    comment: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if comments are allowed
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "allow_comments").first()
    if setting and setting.value == "false":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Comments are currently disabled by the administrator"
        )

    shoutout = db.get(models.ShoutOut, shoutout_id)
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    new_comment = models.Comment(
        shoutout_id=shoutout_id,
        user_id=current_user.id,
        content=comment.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # Create Notification for Comment
    if shoutout.sender_id != current_user.id:
        notification = models.Notification(
            recipient_id=shoutout.sender_id,
            sender_id=current_user.id,
            shoutout_id=shoutout.id,
            comment_id=new_comment.id,
            type="comment",
            message=f"{current_user.name} commented on your shoutout!",
            is_read="false"
        )
        db.add(notification)
        db.commit()

    return new_comment
