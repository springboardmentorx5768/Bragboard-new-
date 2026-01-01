from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/api/brags",
    tags=["Brags"]
)

import json

def parse_brag_media(brag):
    """Helper to parse JSON media strings back to lists."""
    if brag.image_url:
        try:
            brag.image_url = json.loads(brag.image_url)
        except:
             # Backward compatibility: treat as single string in list
             brag.image_url = [brag.image_url] if brag.image_url else []
    else:
        brag.image_url = []

    if brag.video_url:
        try:
            brag.video_url = json.loads(brag.video_url)
        except:
             brag.video_url = [brag.video_url] if brag.video_url else []
    else:
        brag.video_url = []
    return brag

@router.post("/", response_model=schemas.BragResponse)
def create_brag(
    brag: schemas.BragCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User must belong to a department to post a brag."
        )

    try:
        new_brag = models.Brag(
            title=brag.title,
            content=brag.content,
            image_url=json.dumps(brag.image_url) if brag.image_url else None,
            video_url=json.dumps(brag.video_url) if brag.video_url else None,
            tags=brag.tags,
            user_id=current_user.id,
            department_id=current_user.department_id
        )
        db.add(new_brag)
        db.commit()
        db.refresh(new_brag)

        # Create self-notification
        self_notification = models.Notification(
            user_id=current_user.id,
            message="You posted a brag!",
            type="brag",
            source_id=new_brag.id
        )
        db.add(self_notification)

        # Create notifications for department colleagues
        colleagues = db.query(models.User).filter(
            models.User.department_id == current_user.department_id,
            models.User.id != current_user.id
        ).all()
        
        # Regex to find mentions (simple: @Name) - more robust would be IDs, but text is what we have
        import re
        mentioned_names = re.findall(r'@(\w+)', new_brag.content)
        
        for col in colleagues:
            message = f"{current_user.name} shared a new brag!"
            # Check if user is mentioned
            if col.name in mentioned_names: 
                message = f"{current_user.name} mentioned you in a brag!"
            
            col_notification = models.Notification(
                user_id=col.id,
                message=message,
                type="brag",
                source_id=new_brag.id
            )
            db.add(col_notification)
        
        db.commit()
        return parse_brag_media(new_brag)
    except Exception as e:
        db.rollback()
        print(f"Error creating post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/department", response_model=List[schemas.BragResponse])
def get_department_brags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.department_id:
        return [] 
    
    # We can now query safely using ID
    brags = db.query(models.Brag).options(
        joinedload(models.Brag.user)
    ).filter(models.Brag.department_id == current_user.department_id).order_by(models.Brag.created_at.desc()).all()
    
    return [parse_brag_media(b) for b in brags]

@router.get("/my-brags", response_model=List[schemas.BragResponse])
def get_my_brags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    brags = db.query(models.Brag).filter(models.Brag.user_id == current_user.id).all()
    return [parse_brag_media(b) for b in brags]

@router.delete("/{brag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brag(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
        
    if brag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brag")
        
    db.delete(brag)
    db.commit()
    return None

@router.put("/{brag_id}", response_model=schemas.BragResponse)
def update_brag(
    brag_id: int,
    brag_update: schemas.BragCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
        
    if brag.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this brag")
        
    brag.title = brag_update.title
    brag.content = brag_update.content
    brag.image_url = json.dumps(brag_update.image_url) if brag_update.image_url else None
    brag.video_url = json.dumps(brag_update.video_url) if brag_update.video_url else None
    brag.tags = brag_update.tags
    
    db.commit()
    db.refresh(brag)
    return parse_brag_media(brag)
