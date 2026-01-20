from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database
from ..deps import get_db, get_current_user
from datetime import datetime

router = APIRouter(
    prefix="/comments",
    tags=["comments"]
)

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Recursive delete of replies? 
    # SQLAlchemy might handle cascade if configured, otherwise we manual delete or leave orphans.
    # For now, let's just delete the comment. If DB enforces FK, it might fail if children exist.
    # If using SQLite default, FKs might not be enforced strictly or cascade might not be on.
    # Let's try to delete. If it fails due to constraint, we know we need cascade.
    
    db.delete(comment)
    db.commit()
    return None

@router.put("/{comment_id}", response_model=schemas.CommentOut)
def update_comment(
    comment_id: int,
    comment_update: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    comment.content = comment_update.content
    # We could track edit history like shoutouts if needed, but for now just content.
    
    db.commit()
    db.refresh(comment)
    return comment
