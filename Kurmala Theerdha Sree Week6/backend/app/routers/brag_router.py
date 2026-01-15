from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..deps import get_db
from ..deps import get_current_user
from typing import List

router = APIRouter(tags=["Brags"])

@router.post("/brags", response_model=schemas.BragOut)
def create_brag(
    content: str = Form(...),
    recipient_ids: str = Form(...),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        import json
        brag_data = schemas.BragCreate(
            content=content,
            recipient_ids=json.loads(recipient_ids)
        )
        brag = crud.create_brag(db, brag_data, current_user.id)
        
        # Handle file uploads
        if files:
            for file in files:
                if file.filename:
                    crud.save_attachment(db, file, brag.id)
        
        # Refresh to include attachments
        db.refresh(brag)
        return brag
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/brags/my", response_model=list[schemas.BragOut])
def get_my_brags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_brags(db, current_user.id)

@router.get("/brags/for-me", response_model=list[schemas.BragOut])
def get_brags_for_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_brags_for_user(db, current_user.id)

@router.get("/brags/feed", response_model=list[schemas.BragOut])
def get_brag_feed(
    limit: int = 50,
    department: str = None,
    sender: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_all_brags(db, limit, department, sender, date_from, date_to)

@router.delete("/brags/{brag_id}")
def delete_brag(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    if brag.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this brag")
    
    # delete related reactions and attachments first to avoid FK constraint issues
    db.query(models.Reaction).filter(models.Reaction.brag_id == brag_id).delete(synchronize_session=False)
    db.query(models.Attachment).filter(models.Attachment.brag_id == brag_id).delete(synchronize_session=False)
    db.query(models.Comment).filter(models.Comment.brag_id == brag_id).delete(synchronize_session=False)
    # remove association table entries
    try:
        db.execute(models.brag_recipients.delete().where(models.brag_recipients.c.brag_id == brag_id))
    except Exception:
        pass
    db.delete(brag)
    db.commit()
    return {"message": "Brag deleted successfully"}

@router.post("/brags/{brag_id}/reactions", response_model=schemas.ReactionOut)
def add_reaction_to_brag(
    brag_id: int,
    reaction: schemas.ReactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    return crud.add_reaction(db, brag_id, current_user.id, reaction.reaction_type)

@router.delete("/brags/{brag_id}/reactions")
def remove_reaction_from_brag(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    removed = crud.remove_reaction(db, brag_id, current_user.id)
    if not removed:
        raise HTTPException(status_code=404, detail="Reaction not found")
    
    return {"message": "Reaction removed successfully"}

@router.get("/brags/{brag_id}/reactions", response_model=list[schemas.ReactionOut])
def get_reactions_for_brag(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    return crud.get_reactions_for_brag(db, brag_id)

@router.post("/brags/{brag_id}/comments", response_model=schemas.CommentOut)
def add_comment_to_brag(
    brag_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    return crud.create_comment(db, brag_id, current_user.id, comment)

@router.get("/brags/{brag_id}/comments", response_model=list[schemas.CommentOut])
def get_comments_for_brag(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    return crud.get_comments_for_brag(db, brag_id)

@router.delete("/brags/{brag_id}/comments/{comment_id}")
def delete_comment_from_brag(
    brag_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    deleted = crud.delete_comment(db, comment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    return {"message": "Comment deleted successfully"}
