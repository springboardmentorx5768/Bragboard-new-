from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/api/brags",
    tags=["Brags"]
)

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
            image_url=brag.image_url,
            tags=brag.tags,
            user_id=current_user.id,
            department_id=current_user.department_id
        )
        db.add(new_brag)
        db.commit()
        db.refresh(new_brag)
        return new_brag
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
    return brags

@router.get("/my-brags", response_model=List[schemas.BragResponse])
def get_my_brags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    brags = db.query(models.Brag).filter(models.Brag.user_id == current_user.id).all()
    return brags

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
    brag.image_url = brag_update.image_url
    brag.tags = brag_update.tags
    
    db.commit()
    db.refresh(brag)
    return brag
