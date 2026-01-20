from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database import get_db
from ..security import get_current_user 
from .. import models, schemas 

router = APIRouter(prefix="/shoutouts", tags=["ShoutOuts"])

@router.get("/", response_model=List[schemas.ShoutOutOut])
def get_shoutouts(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    dept: Optional[str] = None,
    sender_id: Optional[int] = None,
    date: Optional[str] = None
):
    query = db.query(models.ShoutOut, models.User.name.label("sender_name")).join(
        models.User, models.ShoutOut.sender_id == models.User.id
    )

    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)
    if date:
        query = query.filter(models.ShoutOut.created_at.contains(date))

    results = query.order_by(desc(models.ShoutOut.created_at)).all()
    shoutouts_list = []

    for so, name in results:
        so.sender_name = name 
        recipient_entry = db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.shoutout_id == so.id).first()
        
        if recipient_entry:
            target_user = db.query(models.User).filter(models.User.id == recipient_entry.recipient_id).first()
            so.target_dept = target_user.department if target_user else "TEAM"
        else:
            so.target_dept = "TEAM"

        if dept and so.target_dept.upper() != dept.upper():
            continue
    
        so.reaction_counts = {
            "like": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'like').count(),
            "clap": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'clap').count(),
            "star": db.query(models.Reaction).filter(models.Reaction.shoutout_id == so.id, models.Reaction.reaction_type == 'star').count()
        }
        shoutouts_list.append(so)
    return shoutouts_list

@router.post("/{shoutout_id}/react")
def toggle_reaction(shoutout_id: int, reaction_type: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == shoutout_id,
        models.Reaction.user_id == current_user.id,
        models.Reaction.reaction_type == reaction_type
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Removed"}
    
    new_react = models.Reaction(shoutout_id=shoutout_id, user_id=current_user.id, reaction_type=reaction_type)
    db.add(new_react)
    db.commit()
    return {"message": "Added"}