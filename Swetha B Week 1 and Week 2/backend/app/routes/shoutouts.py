from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.shoutout import ShoutOut
from models.user import User
from schemas.shoutout import ShoutOutCreate

router = APIRouter(prefix="/shoutouts", tags=["ShoutOuts"])

@router.post("/")
def create_shoutout(data: ShoutOutCreate, db: Session = Depends(get_db)):
    users = db.query(User).filter(User.id.in_(data.recipient_ids)).all()

    shoutout = ShoutOut(
        message=data.message,
        tagged_users=users
    )

    db.add(shoutout)
    db.commit()
    db.refresh(shoutout)

    return {
        "message": "Shout-out created successfully",
        "shoutout_id": shoutout.id
    }
