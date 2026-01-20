from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Report, ShoutOut, Comment, User, UserRole
from ..schemas import ReportCreate, ReportOut
from ..deps import get_current_user, get_current_admin

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

@router.post("/", response_model=ReportOut)
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not report.shoutout_id and not report.comment_id:
        raise HTTPException(status_code=400, detail="Must report either a shoutout or a comment")
    
    if report.shoutout_id:
        shoutout = db.get(ShoutOut, report.shoutout_id)
        if not shoutout:
            raise HTTPException(status_code=404, detail="Shoutout not found")
            
    if report.comment_id:
        comment = db.get(Comment, report.comment_id)
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

    new_report = Report(
        reason=report.reason,
        shoutout_id=report.shoutout_id,
        comment_id=report.comment_id,
        reported_by=current_user.id
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/admin/all", response_model=List[ReportOut])
def get_all_reports(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    return db.query(Report).filter(Report.is_resolved == "false").all()

@router.post("/admin/{report_id}/resolve")
def resolve_report(
    report_id: int,
    action: str, # "delete" or "ignore"
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if action == "ignore":
        report.is_resolved = "ignored"
        db.commit()
        return {"message": "Report ignored"}
    
    elif action == "delete":
        if report.shoutout_id:
            shoutout = db.get(ShoutOut, report.shoutout_id)
            if shoutout:
                db.delete(shoutout)
        
        if report.comment_id:
            comment = db.get(Comment, report.comment_id)
            if comment:
                db.delete(comment)
        
        report.is_resolved = "deleted"
        db.commit()
        return {"message": "Content deleted and report resolved"}
    
    else:
         raise HTTPException(status_code=400, detail="Invalid action")
