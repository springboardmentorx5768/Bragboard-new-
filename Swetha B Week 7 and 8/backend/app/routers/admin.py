from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user
import csv
import io
from fastapi.responses import StreamingResponse
from fpdf import FPDF

router = APIRouter(prefix="/admin", tags=["Admin"])

# Dependency to check if user is admin
def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    return current_user

@router.get("/stats", response_model=schemas.AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    total_users = db.query(models.User).count()
    total_shoutouts = db.query(models.ShoutOut).count()
    reports_count = db.query(models.Report).count()
    
    # Top Sender
    # Query to count shoutouts sent by each user
    top_sender_qs = db.query(
        models.ShoutOut.sender_id, func.count(models.ShoutOut.id).label('count')
    ).group_by(models.ShoutOut.sender_id).order_by(desc('count')).first()
    
    top_sender_name = None
    if top_sender_qs:
        sender = db.query(models.User).filter(models.User.id == top_sender_qs[0]).first()
        if sender:
            top_sender_name = f"{sender.name} ({top_sender_qs[1]})"
            
    # Top Receiver
    # Query to count shoutouts received
    top_receiver_qs = db.query(
        models.ShoutOutRecipient.recipient_id, func.count(models.ShoutOutRecipient.id).label('count')
    ).group_by(models.ShoutOutRecipient.recipient_id).order_by(desc('count')).first()
    
    top_receiver_name = None
    if top_receiver_qs:
        receiver = db.query(models.User).filter(models.User.id == top_receiver_qs[0]).first()
        if receiver:
            top_receiver_name = f"{receiver.name} ({top_receiver_qs[1]})"

    return {
        "total_users": total_users,
        "total_shoutouts": total_shoutouts,
        "top_sender": top_sender_name,
        "top_receiver": top_receiver_name,
        "reports_count": reports_count
    }

@router.get("/reports", response_model=list[schemas.ReportOut])
def get_reports(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    reports = db.query(models.Report).all()
    return reports

@router.delete("/reports/{report_id}", status_code=204)
def resolve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report)
    db.commit()
    return None

@router.delete("/shoutouts/{shoutout_id}", status_code=204)
def admin_delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    # Cascade delete (manual just in case)
    db.query(models.Reaction).filter(models.Reaction.shoutout_id == shoutout_id).delete()
    db.query(models.Comment).filter(models.Comment.shoutout_id == shoutout_id).delete()
    db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.shoutout_id == shoutout_id).delete()
    db.query(models.Report).filter(models.Report.shoutout_id == shoutout_id).delete()
    
    db.delete(shoutout)
    
    # Log admin action
    log = models.AdminLog(
        admin_id=current_admin.id,
        action="delete_shoutout",
        target_id=shoutout_id,
        target_type="shoutout"
    )
    db.add(log)
    
    db.commit()
    return None

@router.get("/export")
def export_data(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    shoutouts = db.query(models.ShoutOut).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'Sender', 'Message', 'Date', 'Likes', 'Claps', 'Laughs'])
    
    for s in shoutouts:
        likes = sum(1 for r in s.reactions if r.type == models.ReactionType.LIKE)
        claps = sum(1 for r in s.reactions if r.type == models.ReactionType.CLAP)
        laughs = sum(1 for r in s.reactions if r.type == models.ReactionType.LAUGHING)
        
        writer.writerow([
            s.id,
            s.sender.name if s.sender else "Unknown",
            s.message,
            s.created_at,
            likes,
            claps,
            laughs
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=shoutouts_export.csv"
    return response

@router.get("/export", response_class=StreamingResponse)
def export_reports(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    reports = db.query(models.Report).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Report ID', 'Reported By', 'Type', 'Target ID', 'Reason', 'Date'])
    
    for r in reports:
        report_type = "Shoutout" if r.shoutout_id else "Comment"
        target_id = r.shoutout_id if r.shoutout_id else r.comment_id
        reporter_name = r.reporter.name if r.reporter else f"User {r.reported_by}"
        
        writer.writerow([
            r.id,
            reporter_name,
            report_type,
            target_id,
            r.reason,
            r.created_at
        ])
        
    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=reports_export.csv"
    return response

@router.get("/export-pdf", response_class=StreamingResponse)
def export_reports_pdf(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    reports = db.query(models.Report).all()
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)
    
    # Title
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "Moderation Reports", 0, 1, 'C')
    pdf.ln(5)
    
    # Table Header
    pdf.set_font("Arial", 'B', 10)
    # Widths: ID(10), Reporter(40), Type(20), Target(15), Reason(70), Date(35)
    cols = [10, 40, 20, 15, 70, 35]
    headers = ['ID', 'Reporter', 'Type', 'Target', 'Reason', 'Date']
    
    for i in range(len(headers)):
        pdf.cell(cols[i], 10, headers[i], 1)
    pdf.ln()
    
    # Table Body
    pdf.set_font("Arial", size=9)
    for r in reports:
        report_type = "Shoutout" if r.shoutout_id else "Comment"
        target_id = str(r.shoutout_id if r.shoutout_id else r.comment_id)
        reporter_name = r.reporter.name if r.reporter else f"User {r.reported_by}"
        # Truncate reason to fit
        reason = (r.reason[:35] + '..') if len(r.reason) > 35 else r.reason
        date_str = r.created_at.strftime("%Y-%m-%d")
        
        row = [str(r.id), reporter_name, report_type, target_id, reason, date_str]
        
        # Max height for cell is tricky if valid text wrapping isn't used, but we use simple cell here
        for i in range(len(row)):
            pdf.cell(cols[i], 10, row[i], 1)
        pdf.ln()

    # Output to buffer
    # FPDF output(dest='S') returns a string. We encode it to bytes.
    pdf_content = pdf.output(dest='S').encode('latin-1')
    buffer = io.BytesIO(pdf_content)
    
    response = StreamingResponse(buffer, media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=reports_export.pdf"
    return response

@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db)
):
    # Simple scoring: 1 shoutout sent = 10 pts, 1 received = 5 pts
    # This is a bit complex to query efficiently in one go with ORM simple queries.
    # Let's fetch users and calculate in python for MVP (dataset is small)
    
    users = db.query(models.User).all()
    leaderboard = []
    
    for u in users:
        sent = len(u.shoutouts_sent)
        received_count = db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.recipient_id == u.id).count()
        score = (sent * 10) + (received_count * 5)
        leaderboard.append({"user": u, "score": score})
        
    # Sort
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    
    # Add rank
    result = []
    for i, entry in enumerate(leaderboard):
        result.append({
            "user": entry["user"],
            "score": entry["score"],
            "rank": i + 1
        })
        
    return result
