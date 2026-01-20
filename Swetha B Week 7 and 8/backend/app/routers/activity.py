from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user
import datetime

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.post("/screen-time", status_code=204)
def log_screen_time(
    duration: int, # seconds
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if entry exists for today
    entry = db.query(models.ScreenTime).filter(
        models.ScreenTime.user_id == current_user.id,
        models.ScreenTime.date == today
    ).first()
    
    if entry:
        entry.duration_seconds += duration
    else:
        entry = models.ScreenTime(
            user_id=current_user.id,
            date=today,
            duration_seconds=duration
        )
        db.add(entry)
    
    db.commit()
    return None

@router.get("/dashboard")
def get_dashboard_stats(
    filter: str = "week", # day, week, month
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Date Range Logic
    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if filter == "day":
        start_date = today_start
    elif filter == "month":
        start_date = today_start - datetime.timedelta(days=30)
    else: # default to week
        start_date = today_start - datetime.timedelta(days=7)

    # 2. Query Screen Time
    screen_time_logs = db.query(models.ScreenTime).filter(
        models.ScreenTime.user_id == current_user.id,
        models.ScreenTime.date >= start_date
    ).order_by(models.ScreenTime.date).all()
    
    screen_time_data = [
        {"date": log.date.strftime("%Y-%m-%d"), "minutes": log.duration_seconds // 60}
        for log in screen_time_logs
    ]
    
    # 3. My Recent Shoutouts
    my_shoutouts = db.query(models.ShoutOut).filter(
        models.ShoutOut.sender_id == current_user.id
    ).order_by(models.ShoutOut.created_at.desc()).limit(10).all()

    my_shoutouts_data = []
    for s in my_shoutouts:
        recipient_names = [r.recipient.name for r in s.recipients if r.recipient]
        
        if len(recipient_names) > 3:
            display_name = "Everyone"
        elif recipient_names:
            display_name = ", ".join(recipient_names)
        else:
            display_name = "Team"
        
        my_shoutouts_data.append({
            "id": s.id, 
            "message": s.message, 
            "created_at": s.created_at,
            "recipient_name": display_name
        })

    return {
        "screen_time": screen_time_data,
        "my_shoutouts": my_shoutouts_data,
        "stats": {
            "total_screen_time_minutes": sum(log.duration_seconds for log in screen_time_logs) // 60,
            "shoutouts_sent": len(current_user.shoutouts_sent)
        }
    }
