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
# ----------------  REPORTS ----------------

@router.post("/brags/{brag_id}/reports", response_model=schemas.ReportOut)
def report_brag(
    brag_id: int,
    report: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Report a brag"""
    try:
        # Create a new report with the brag_id from the path
        # instead of trying to modify the Pydantic model
        report_data = schemas.ReportCreate(
            brag_id=brag_id,
            reason=report.reason,
            description=report.description
        )
        db_report = crud.create_report(db, report_data, current_user.id)
        return db_report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create report")

@router.get("/reports/my", response_model=list[schemas.ReportOut])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all reports made by current user"""
    return crud.get_user_reports(db, current_user.id)

@router.get("/reports/admin", response_model=list[schemas.ReportOut])
def get_all_reports_admin(
    status: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all reports - available to all authenticated users"""
    # Allow all authenticated users to view reports
    return crud.get_all_reports(db, status, limit)

@router.get("/reports/admin/stats", response_model=dict)
def get_report_stats_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get report statistics - available to all authenticated users"""
    # Allow all authenticated users to view statistics
    return crud.get_report_stats(db)

@router.get("/reports/{report_id}", response_model=schemas.ReportDetailOut)
def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed report information"""
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check authorization
    if current_user.role != models.RoleEnum.admin and report.reported_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
    
    return report

@router.put("/reports/{report_id}", response_model=schemas.ReportOut)
def resolve_report_endpoint(
    report_id: int,
    update: schemas.ReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Resolve a report (admin only)"""
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admins can resolve reports")
    
    try:
        report = crud.resolve_report(
            db, 
            report_id, 
            current_user.id, 
            update.status, 
            update.resolution_notes
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/brags/{brag_id}/reports", response_model=list[schemas.ReportOut])
def get_brag_reports(
    brag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all reports for a specific brag (admin only)"""
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admins can view reports")
    
    brag = db.query(models.Brag).filter(models.Brag.id == brag_id).first()
    if not brag:
        raise HTTPException(status_code=404, detail="Brag not found")
    
    return crud.get_brag_reports(db, brag_id)