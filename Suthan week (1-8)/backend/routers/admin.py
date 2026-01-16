from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import List, Dict, Any
from database import get_db
import models, schemas, auth
import csv
import io
from fpdf import FPDF
from datetime import datetime

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

def check_admin(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    # 1. Total Counts
    total_users = db.query(models.User).count()
    total_shoutouts = db.query(models.ShoutOut).count()
    pending_reports = db.query(models.Report).count() # Currently assuming all reports in table are pending/active history

    # 2. Top Contributors (Most shoutouts sent)
    top_contributors_query = db.query(
        models.User,
        func.count(models.ShoutOut.id).label('count')
    ).join(models.ShoutOut, models.User.id == models.ShoutOut.sender_id)\
     .group_by(models.User.id)\
     .order_by(desc('count'))\
     .limit(5).all()

    top_contributors = [
        {"user": schemas.UserResponse.model_validate(u), "count": count} 
        for u, count in top_contributors_query
    ]

    # 3. Most Appreciated (Most shoutouts received)
    most_appreciated_query = db.query(
        models.User,
        func.count(models.ShoutOutRecipient.id).label('count')
    ).join(models.ShoutOutRecipient, models.User.id == models.ShoutOutRecipient.recipient_id)\
     .group_by(models.User.id)\
     .order_by(desc('count'))\
     .limit(5).all()

    most_appreciated = [
        {"user": schemas.UserResponse.model_validate(u), "count": count}
        for u, count in most_appreciated_query
    ]

    return {
        "overview": {
            "total_users": total_users,
            "total_shoutouts": total_shoutouts,
            "pending_reports": pending_reports
        },
        "top_contributors": top_contributors,
        "most_appreciated": most_appreciated
    }

@router.get("/reports", response_model=List[schemas.ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    # Fetch all reports with shoutout details and comments for moderation
    reports = db.query(models.Report).options(
        joinedload(models.Report.shoutout).joinedload(models.ShoutOut.comments).joinedload(models.Comment.user)
    ).order_by(models.Report.created_at.desc()).all()
    return reports

@router.put("/reports/{id}/resolve", response_model=schemas.ReportResponse)
def resolve_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    # Instead of deleting, we update the status
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = "Resolved"
    
    # Log Action
    db_log = models.AdminLog(
        admin_id=current_user.id,
        action=f"Marked report #{id} for shoutout #{report.shoutout_id} as Resolved",
        target_id=report.id,
        target_type="report"
    )
    db.add(db_log)
    db.commit()
    db.refresh(report)
    return report

@router.get("/reports/export")
def export_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    reports = db.query(models.Report).all()
    # Get leaderboard data for the export
    leaderboard = get_leaderboard(db, current_user)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Section 1: Overall Leaderboard
    writer.writerow(['--- OVERALL LEADERBOARD ---'])
    writer.writerow(['Rank', 'Name', 'Email', 'Department', 'Points', 'Received', 'Sent', 'Stars', 'Claps', 'Likes'])
    for entry in leaderboard['overall']:
        u = entry['user']
        writer.writerow([
            entry['rank'], u.name, u.email, 
            u.department.name if u.department else 'Central Team',
            entry['points'], entry['shoutouts_received'], entry['shoutouts_sent'],
            entry['stars_received'], entry['claps_received'], entry['likes_received']
        ])
    
    writer.writerow([])
    # Section 2: Top Contributors
    writer.writerow(['--- TOP CONTRIBUTORS ---'])
    writer.writerow(['Name', 'Posts Sent'])
    for entry in leaderboard['top_contributors']:
        writer.writerow([entry['user'].name, entry['count']])
        
    writer.writerow([])
    # Section 3: Most Tagged
    writer.writerow(['--- MOST TAGGED ---'])
    writer.writerow(['Name', 'Times Tagged'])
    for entry in leaderboard['most_tagged']:
        writer.writerow([entry['user'].name, entry['count']])

    writer.writerow([])
    # Section 4: Reports Trace
    writer.writerow(['--- DETAILED REPORTS LOG ---'])
    writer.writerow(['Report ID', 'Shoutout ID', 'Status', 'Reported By', 'Reason', 'Date'])
    for r in reports:
        reporter_name = db.query(models.User.name).filter(models.User.id == r.reported_by).scalar() or "Unknown"
        writer.writerow([r.id, r.shoutout_id, r.status, reporter_name, r.reason, r.created_at])
    
    output.seek(0)
    
    # Log Export
    db_log = models.AdminLog(
        admin_id=current_user.id,
        action="Exported full audit log to CSV",
        target_type="system"
    )
    db.add(db_log)
    db.commit()

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=platform_audit_export.csv"}
    )

@router.get("/reports/export/pdf")
def export_reports_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    reports = db.query(models.Report).options(joinedload(models.Report.reporter)).all()
    leaderboard = get_leaderboard(db, current_user)
    
    pdf = FPDF()
    pdf.add_page()
    
    # Title
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(16, 185, 129) # Emerald 500
    pdf.cell(190, 15, "PLATFORM AUDIT & PERFORMANCE LOG", ln=True, align="C")
    
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(190, 8, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align="C")
    pdf.ln(10)

    # Section 1: Leaderboard Summary
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(190, 10, "1. PERFORMANCE SUMMARIES", ln=True)
    pdf.ln(2)

    # Overall Top 5
    pdf.set_font("helvetica", "B", 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(190, 8, "Overall Top 5 Performers", 0, 1, "L", True)
    pdf.set_font("helvetica", "B", 9)
    pdf.cell(20, 8, "Rank", 1, 0, "C")
    pdf.cell(80, 8, "Name", 1, 0, "C")
    pdf.cell(60, 8, "Department", 1, 0, "C")
    pdf.cell(30, 8, "Points", 1, 1, "C")
    
    pdf.set_font("helvetica", "", 9)
    for entry in leaderboard['overall'][:5]:
        u = entry['user']
        safe_uname = u.name.encode('latin-1', 'replace').decode('latin-1')[:35]
        safe_dept = (u.department.name if u.department else 'Central').encode('latin-1', 'replace').decode('latin-1')[:25]
        
        pdf.cell(20, 8, f"#{entry['rank']}", 1, 0, "C")
        pdf.cell(80, 8, safe_uname, 1, 0, "L")
        pdf.cell(60, 8, safe_dept, 1, 0, "L")
        pdf.cell(30, 8, str(entry['points']), 1, 1, "C")
    
    pdf.ln(5)
    
    # Contributors & Tagged (Side by Side)
    pdf.set_font("helvetica", "B", 11)
    pdf.cell(90, 8, "Top 5 Contributors", 0, 0, "L", True)
    pdf.cell(10, 8, "", 0, 0)
    pdf.cell(90, 8, "Most Tagged Users", 0, 1, "L", True)
    
    pdf.set_font("helvetica", "B", 9)
    pdf.cell(60, 8, "Name", 1, 0, "C")
    pdf.cell(30, 8, "Posts", 1, 0, "C")
    pdf.cell(10, 8, "", 0, 0)
    pdf.cell(60, 8, "Name", 1, 0, "C")
    pdf.cell(30, 8, "Tags", 1, 1, "C")
    
    pdf.set_font("helvetica", "", 9)
    top_c = leaderboard['top_contributors'][:5]
    most_t = leaderboard['most_tagged'][:5]
    for i in range(5):
        # Contributor col
        if i < len(top_c):
            safe_cname = top_c[i]['user'].name.encode('latin-1', 'replace').decode('latin-1')[:25]
            pdf.cell(60, 8, safe_cname, 1)
            pdf.cell(30, 8, str(top_c[i]['count']), 1, 0, "C")
        else:
            pdf.cell(90, 8, "", 0)
            
        pdf.cell(10, 8, "", 0, 0)
        
        # Tagged col
        if i < len(most_t):
            safe_tname = most_t[i]['user'].name.encode('latin-1', 'replace').decode('latin-1')[:25]
            pdf.cell(60, 8, safe_tname, 1)
            pdf.cell(30, 8, str(most_t[i]['count']), 1, 1, "C")
        else:
            pdf.cell(90, 8, "", 1, 1)

    pdf.ln(10)

    # Section 2: Detailed Reports Log
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(190, 10, "2. DETAILED CONTENT AUDIT LOG", ln=True)
    pdf.ln(2)
    
    # Reports Table
    pdf.set_fill_color(200, 220, 255)
    pdf.set_font("helvetica", "B", 9)
    pdf.cell(15, 8, "ID", 1, 0, "C", True)
    pdf.cell(20, 8, "Status", 1, 0, "C", True)
    pdf.cell(35, 8, "Reporter", 1, 0, "C", True)
    pdf.cell(80, 8, "Reason", 1, 0, "C", True)
    pdf.cell(40, 8, "Date", 1, 1, "C", True)
    
    pdf.set_font("helvetica", "", 8)
    for r in reports:
        reporter_name = r.reporter.name if r.reporter else f"UID:{r.reported_by}"
        safe_name = reporter_name.encode('latin-1', 'replace').decode('latin-1')[:18]
        safe_reason = r.reason.encode('latin-1', 'replace').decode('latin-1')[:50]
        
        # Color code status
        if r.status == "Pending":
            pdf.set_text_color(220, 38, 38) # Red
        else:
            pdf.set_text_color(5, 150, 105) # Emerald
            
        pdf.cell(15, 8, str(r.id), 1, 0, "C")
        pdf.cell(20, 8, r.status, 1, 0, "C")
        pdf.set_text_color(0, 0, 0)
        pdf.cell(35, 8, safe_name, 1)
        pdf.cell(80, 8, safe_reason, 1)
        pdf.cell(40, 8, str(r.created_at.strftime('%Y-%m-%d %H:%M')) if r.created_at else "N/A", 1, 1, "C")
    
    # Log Export
    db_log = models.AdminLog(
        admin_id=current_user.id,
        action="Exported detailed platform audit PDF",
        target_type="system"
    )
    db.add(db_log)
    db.commit()

    return Response(
        content=bytes(pdf.output()),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=platform_audit_audit.pdf"}
    )

@router.put("/users/{id}", response_model=schemas.UserResponse)
def update_user(
    id: int,
    user_update: schemas.UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.name is not None:
        user.name = user_update.name
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.department_id is not None:
        user.department_id = user_update.department_id
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.user_id is not None:
        user.user_id = user_update.user_id
        
    try:
        db.commit()
        db.refresh(user)
        
        # Log Action
        db_log = models.AdminLog(
            admin_id=current_user.id,
            action=f"Updated user profile: {user.email}",
            target_id=user.id,
            target_type="user"
        )
        db.add(db_log)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")
        
    return user

@router.put("/reports/{id}", response_model=schemas.ReportResponse)
def update_report(
    id: int,
    report_update: schemas.ReportUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    report = db.query(models.Report).filter(models.Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.reason = report_update.reason
    
    # Log Action
    db_log = models.AdminLog(
        admin_id=current_user.id,
        action=f"Edited report details for report #{id}",
        target_id=report.id,
        target_type="report"
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(report)
    return report

@router.get("/leaderboard", response_model=schemas.UnifiedLeaderboardResponse)
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Overall Rankings (Points based)
    users = db.query(models.User).filter(models.User.role == models.UserRole.employee).all()
    overall_data = []
    
    for user in users:
        received_count = db.query(models.ShoutOutRecipient).filter(models.ShoutOutRecipient.recipient_id == user.id).count()
        sent_count = db.query(models.ShoutOut).filter(models.ShoutOut.sender_id == user.id).count()
        user_shoutout_ids = db.query(models.ShoutOut.id).filter(models.ShoutOut.sender_id == user.id).subquery()
        reactions = db.query(models.Reaction).filter(models.Reaction.shoutout_id.in_(user_shoutout_ids)).all()
        
        stars, claps, likes = 0, 0, 0
        for r in reactions:
            r_type = r.type.value if hasattr(r.type, 'value') else r.type
            if r_type == 'star': stars += 1
            elif r_type == 'clap': claps += 1
            elif r_type == 'like': likes += 1
            
        points = (received_count * 50) + (sent_count * 30) + (stars * 20) + (claps * 10) + (likes * 5)
        
        overall_data.append({
            "user": user,
            "points": points,
            "shoutouts_received": received_count,
            "shoutouts_sent": sent_count,
            "stars_received": stars,
            "claps_received": claps,
            "likes_received": likes
        })
    
    overall_data.sort(key=lambda x: x['points'], reverse=True)
    for i, entry in enumerate(overall_data):
        entry['rank'] = i + 1

    # 2. Top Contributors (Most shoutouts sent)
    top_contributors_query = db.query(
        models.User,
        func.count(models.ShoutOut.id).label('count')
    ).join(models.ShoutOut, models.User.id == models.ShoutOut.sender_id)\
     .group_by(models.User.id)\
     .order_by(desc('count'))\
     .limit(10).all()

    top_contributors = [
        {"user": u, "count": count} 
        for u, count in top_contributors_query
    ]

    # 3. Most Appreciated (Most shoutouts received)
    most_tagged_query = db.query(
        models.User,
        func.count(models.ShoutOutRecipient.id).label('count')
    ).join(models.ShoutOutRecipient, models.User.id == models.ShoutOutRecipient.recipient_id)\
     .group_by(models.User.id)\
     .order_by(desc('count'))\
     .limit(10).all()

    most_tagged = [
        {"user": u, "count": count}
        for u, count in most_tagged_query
    ]

    return {
        "overall": overall_data,
        "top_contributors": top_contributors,
        "most_tagged": most_tagged
    }

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_admin)
):
    return db.query(models.User).order_by(models.User.id).all()
