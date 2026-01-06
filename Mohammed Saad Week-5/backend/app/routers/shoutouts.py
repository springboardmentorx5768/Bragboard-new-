import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from .. import models, database, security

# 🎯 Prefix ensures all routes start with /shoutouts
router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(database.get_db)):
    leaderboard = db.query(
        models.User.name,
        models.User.department,
        func.count(models.Reaction.id).label("total_reactions")
    ).join(models.ShoutOutRecipient, models.User.id == models.ShoutOutRecipient.recipient_id) \
     .join(models.Reaction, models.ShoutOutRecipient.shoutout_id == models.Reaction.shoutout_id) \
     .group_by(models.User.id) \
     .order_by(desc("total_reactions")) \
     .limit(5).all()
    return [{"name": r[0], "department": r[1], "score": r[2]} for r in leaderboard]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_shoutout(
    message: str = Form(...),
    recipient_ids: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user),
):
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

    new_shoutout = models.ShoutOut(sender_id=current_user.id, message=message, attachment_url=attachment_url)
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
        reactions_data = {}
        for r_type in ["like", "clap", "star"]:
            reactors = db.query(models.User.name).join(models.Reaction).filter(
                models.Reaction.shoutout_id == s.id, models.Reaction.type == r_type
            ).all()
            reactions_data[r_type] = {"count": len(reactors), "names": [r.name for r in reactors]}
        
        results.append({
            "id": s.id, "message": s.message, "sender_name": s.sender.name,
            "sender_id": s.sender_id, "recipient_names": recipient_names,
            "attachment_url": s.attachment_url, "reactions": reactions_data, 
            "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else None 
        })
    return results

# 🎯 FIXED PATH: Matches frontend POST /shoutouts/{id}/react
@router.post("/{shoutout_id}/react")
def toggle_reaction(
    shoutout_id: int,
    reaction_type: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    existing = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == shoutout_id,
        models.Reaction.user_id == current_user.id,
        models.Reaction.type == reaction_type
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed"}
    
    db.add(models.Reaction(shoutout_id=shoutout_id, user_id=current_user.id, type=reaction_type))
    db.commit()
    return {"status": "added"}

# 🎯 FIXED PATH: Matches frontend GET /shoutouts/users
@router.get("/users")
def get_taggable_users(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return [{"id": user.id, "name": user.name, "department": user.department} for user in users]