from fastapi import APIRouter, Depends, Query, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import shutil
import os
from ..database import get_db
from ..security import get_current_user 
from .. import models, schemas 

router = APIRouter(prefix="/shoutouts", tags=["ShoutOuts"])

@router.post("/")
def create_shoutout(
    message: str = Form(...), 
    recipient_ids: str = Form(...), 
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_so = models.ShoutOut(sender_id=current_user.id, message=message)
    if image:
        os.makedirs("static", exist_ok=True)
        file_path = f"static/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        new_so.image_url = f"/{file_path}"

    db.add(new_so)
    db.flush() 

    if recipient_ids.isdigit():
        recipient = models.ShoutOutRecipient(shoutout_id=new_so.id, recipient_id=int(recipient_ids))
        db.add(recipient)
    
    db.commit()
    return {"message": "Posted"}

@router.get("/", response_model=List[schemas.ShoutOutOut])
def get_shoutouts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user), dept: Optional[str] = None, sender_id: Optional[int] = None, date: Optional[str] = None):
    query = db.query(models.ShoutOut, models.User.name.label("sender_name")).join(models.User, models.ShoutOut.sender_id == models.User.id)
    if sender_id: query = query.filter(models.ShoutOut.sender_id == sender_id)
    if date: query = query.filter(models.ShoutOut.created_at.contains(date))

    results = query.order_by(desc(models.ShoutOut.created_at)).all()
    shoutouts_list = []

    for so, name in results:

        recipient_user = db.query(models.User).join(models.ShoutOutRecipient, models.User.id == models.ShoutOutRecipient.recipient_id).filter(models.ShoutOutRecipient.shoutout_id == so.id).first()
        
        if recipient_user:
            target_dept = recipient_user.department
        else:

            sender_user = db.query(models.User).filter(models.User.id == so.sender_id).first()
            target_dept = sender_user.department if sender_user else "TEAM"

        if dept and target_dept.upper() != dept.upper(): continue

        comments_data = db.query(models.Comment, models.User.name).join(models.User, models.Comment.user_id == models.User.id).filter(models.Comment.shoutout_id == so.id).order_by(models.Comment.created_at.asc()).all()
        formatted_comments = [{"id": c.id, "content": c.content, "user_name": uname, "parent_id": c.parent_id, "created_at": c.created_at} for c, uname in comments_data]

        shoutouts_list.append({
            "id": so.id, "message": so.message, "sender_id": so.sender_id, "sender_name": name,
            "target_dept": target_dept, "image_url": so.image_url, "created_at": so.created_at,
            "reaction_counts": {
                "like": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'like').count(),
                "clap": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'clap').count(),
                "star": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'star').count()
            },
            "comments": formatted_comments
        })
    return shoutouts_list

@router.post("/{shoutout_id}/comment")
def add_comment(shoutout_id: int, content: str, parent_id: Optional[int] = Query(None), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.add(models.Comment(shoutout_id=shoutout_id, user_id=current_user.id, content=content, parent_id=parent_id))
    db.commit()
    return {"message": "Comment posted"}

@router.post("/{shoutout_id}/react")
def toggle_reaction(shoutout_id: int, reaction_type: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Reaction).filter(models.Reaction.shoutout_id == shoutout_id, models.Reaction.user_id == current_user.id, models.Reaction.reaction_type == reaction_type).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Removed"}
    db.add(models.Reaction(shoutout_id=shoutout_id, user_id=current_user.id, reaction_type=reaction_type))
    db.commit()
    return {"message": "Added"}