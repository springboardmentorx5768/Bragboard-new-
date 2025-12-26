import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List

from ..database import get_db
from ..models import User, ShoutOut, SystemSetting
from ..deps import get_current_admin
from .. import schemas

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)]
)

class StatsResponse(BaseModel):
    total_users: int
    total_shoutouts: int

class SettingUpdate(BaseModel):
    key: str
    value: str

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_shoutouts = db.query(ShoutOut).count()
    return {"total_users": total_users, "total_shoutouts": total_shoutouts}

@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    # Convert to dict for easier frontend consumption
    return {s.key: s.value for s in settings}

@router.post("/settings")
def update_setting(setting: SettingUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(SystemSetting).filter(SystemSetting.key == setting.key).first()
    if db_setting:
        db_setting.value = setting.value
    else:
        db_setting = SystemSetting(key=setting.key, value=setting.value)
        db.add(db_setting)
    
    db.commit()
    return {"message": "Setting updated", "key": setting.key, "value": setting.value}

@router.delete("/shoutouts/{shoutout_id}")
def delete_shoutout(shoutout_id: int, db: Session = Depends(get_db)):
    shoutout = db.get(ShoutOut, shoutout_id)
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    db.delete(shoutout)
    db.commit()
    return {"message": "Shoutout deleted"}

@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db)):
    # Return all users, including deleted ones, so admin can see them. 
    # Frontend will handle display distinctions.
    users = db.query(User).all()
    return users

@router.patch("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(user_id: int, role_update: schemas.UserRoleUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_deleted = "true"
    db.commit()
    return {"message": "User deleted"}

@router.get("/stats/top-contributors")
def get_top_contributors(limit: int = 5, db: Session = Depends(get_db)):
    """
    Get users who have sent the most shoutouts.
    """
    results = db.query(
        User,
        func.count(ShoutOut.id).label("count")
    ).join(ShoutOut, User.id == ShoutOut.sender_id)\
     .group_by(User.id)\
     .order_by(func.count(ShoutOut.id).desc())\
     .limit(limit)\
     .all()
    
    return [{"user": user, "count": count} for user, count in results]

@router.get("/reports/export/users")
def export_users_csv(db: Session = Depends(get_db)):
    users = db.query(User).all()
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Header
    writer.writerow(["ID", "Name", "Email", "Department", "Role", "Joined At", "Is Deleted"])
    
    # Rows
    for user in users:
        writer.writerow([
            user.id,
            user.name,
            user.email,
            user.department,
            user.role,
            user.joined_at,
            user.is_deleted
        ])
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=users_report.csv"
    return response

@router.get("/reports/export/shoutouts")
def export_shoutouts_csv(db: Session = Depends(get_db)):
    shoutouts = db.query(ShoutOut).all()
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Header
    writer.writerow(["ID", "Sender", "Message", "Date"])
    
    # Rows
    for shoutout in shoutouts:
        writer.writerow([
            shoutout.id,
            shoutout.sender.name if shoutout.sender else "Unknown",
            shoutout.message,
            shoutout.created_at
        ])
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=shoutouts_report.csv"
    return response

@router.get("/stats/most-tagged")
def get_most_tagged(limit: int = 5, db: Session = Depends(get_db)):
    """
    Get users who have been tagged in the most shoutouts.
    """
    # Import ShoutOutRecipient here to avoid circular imports if any, 
    # though usually top-level is fine. Models are already imported in main.
    from ..models import ShoutOutRecipient

    results = db.query(
        User,
        func.count(ShoutOutRecipient.shoutout_id).label("count")
    ).join(ShoutOutRecipient, User.id == ShoutOutRecipient.recipient_id)\
     .group_by(User.id)\
     .order_by(func.count(ShoutOutRecipient.shoutout_id).desc())\
     .limit(limit)\
     .all()

    return [{"user": user, "count": count} for user, count in results]
