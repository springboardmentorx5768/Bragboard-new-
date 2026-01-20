from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import csv
from io import StringIO, BytesIO
from fastapi.responses import Response, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import base64
from io import BytesIO
import asyncio

# Import your modules
from database import get_db, engine, SessionLocal
from models import Base, User, Department, Shoutout, ShoutoutRecipient, Reaction, Comment, Report, ReactionType
import auth
from schemas import (
    UserCreate, UserResponse, UserLogin, ShoutoutCreate, 
    ShoutoutResponse, ReactionCreate, CommentCreate, ReportCreate,
    LeaderboardEntry, AdminStats, UserStatsResponse, ExportResponse, UserRoleUpdate
)

app = FastAPI(title="BragBoard API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# ========== CREATE DEPARTMENT ENDPOINT ==========

@app.post("/api/departments")
def create_department(
    department_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Create a new department (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    
    # Check if department already exists
    existing_dept = db.query(Department).filter(
        Department.name == department_data["name"]
    ).first()
    
    if existing_dept:
        raise HTTPException(status_code=409, detail="Department already exists")
    
    # Create new department
    new_department = Department(name=department_data["name"])
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return {"id": new_department.id, "name": new_department.name}

# ========== UTILITY FUNCTIONS ==========

def calculate_leaderboard(db: Session):
    users = db.query(User).all()
    leaderboard = []
    
    for user in users:
        # Shoutouts received (as recipient)
        shoutouts_received = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.user_id == user.id
        ).count()
        
        # Reactions received (on user's shoutouts)
        reactions_received = db.query(Reaction).join(Shoutout).filter(
            Shoutout.sender_id == user.id
        ).count()
        
        # Shoutouts sent
        shoutouts_sent = db.query(Shoutout).filter(
            Shoutout.sender_id == user.id
        ).count()
        
        # Comments made
        comments_count = db.query(Comment).filter(
            Comment.user_id == user.id
        ).count()
        
        # Calculate points: 10 for shoutouts received, 5 for reactions, 2 for shoutouts sent, 1 for comments
        points = (shoutouts_received * 10) + (reactions_received * 5) + (shoutouts_sent * 2) + comments_count
        
        department_name = None
        if user.department:
            department_name = user.department.name
        
        leaderboard.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "department_name": department_name,
            "shoutouts_sent": shoutouts_sent,
            "shoutouts_received": shoutouts_received,
            "reactions_received": reactions_received,
            "comments_count": comments_count,
            "score": points
        })
    
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    return leaderboard

# ========== INITIAL DATA SETUP ==========

def init_data():
    """Initialize database with sample data"""
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("Initializing BragBoard Database...")
        print("="*60)
        
        # Drop and recreate all tables to ensure clean state
        print("🔄 Recreating database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        # Create departments
        departments_list = ["Engineering", "Marketing", "Sales", "Human Resources", "Finance", "Operations"]
        
        created_departments = []
        for dept_name in departments_list:
            department = Department(name=dept_name)
            db.add(department)
            created_departments.append(department)
        
        db.commit()
        
        # Refresh to get IDs
        for dept in created_departments:
            db.refresh(dept)
        
        print(f"✅ Created {len(created_departments)} departments")
        
        # Create admin user
        admin_email = "admin@example.com"
        admin_user = User(
            username="admin",
            email=admin_email,
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
            department_id=1  # Engineering
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print("✅ Created admin user: admin@example.com / admin123")
        
        # Create test users
        test_users = [
            {"username": "john_doe", "email": "john@example.com", "role": "employee", "department_id": 1, "password": "password123"},
            {"username": "jane_smith", "email": "jane@example.com", "role": "manager", "department_id": 2, "password": "password123"},
            {"username": "bob_wilson", "email": "bob@example.com", "role": "employee", "department_id": 1, "password": "password123"},
            {"username": "alice_brown", "email": "alice@example.com", "role": "employee", "department_id": 3, "password": "password123"},
            {"username": "charlie_davis", "email": "charlie@example.com", "role": "employee", "department_id": 4, "password": "password123"},
            {"username": "emma_wilson", "email": "emma@example.com", "role": "employee", "department_id": 5, "password": "password123"},
            {"username": "michael_chen", "email": "michael@example.com", "role": "manager", "department_id": 6, "password": "password123"},
        ]
        
        created_users = []
        for user_data in test_users:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=auth.get_password_hash(user_data["password"]),
                role=user_data["role"],
                department_id=user_data["department_id"]
            )
            db.add(user)
            created_users.append(user)
        
        db.commit()
        
        # Refresh to get IDs
        for user in created_users:
            db.refresh(user)
        
        print(f"✅ Created {len(created_users)} test users")
        
        # Get all users including admin
        all_users = [admin_user] + created_users
        
        # Create sample shoutouts
        sample_shoutouts = [
            {
                "sender": all_users[1],  # jane_smith (manager)
                "message": "Great job on the project presentation, John! Your slides were excellent and the delivery was spot on.",
                "recipients": [all_users[0]],  # john_doe
                "reactions": ["like", "clap"]
            },
            {
                "sender": all_users[0],  # john_doe
                "message": "Thanks for helping me debug that tricky issue, Bob! You saved the day and taught me a lot in the process.",
                "recipients": [all_users[2]],  # bob_wilson
                "reactions": ["like", "star"]
            },
            {
                "sender": all_users[2],  # bob_wilson
                "message": "Alice, your customer feedback analysis was incredibly insightful. Great work identifying those key patterns!",
                "recipients": [all_users[3]],  # alice_brown
                "reactions": ["like", "clap", "star"]
            },
            {
                "sender": all_users[3],  # alice_brown
                "message": "Team effort on the Q4 report! Everyone did an amazing job meeting the deadline with quality work.",
                "recipients": [all_users[0], all_users[1], all_users[2]],  # john, jane, bob
                "reactions": ["like", "like", "clap"]
            },
            {
                "sender": all_users[4],  # charlie_davis
                "message": "The new dashboard looks fantastic! Great collaboration between design and engineering teams.",
                "recipients": [all_users[0], all_users[5]],  # john, emma
                "reactions": ["star", "clap"]
            },
        ]
        
        created_shoutouts = []
        for shoutout_data in sample_shoutouts:
            shoutout = Shoutout(
                message=shoutout_data["message"],
                sender_id=shoutout_data["sender"].id
            )
            db.add(shoutout)
            db.flush()  # Get the shoutout ID
            
            for recipient in shoutout_data["recipients"]:
                shoutout_recipient = ShoutoutRecipient(
                    shoutout_id=shoutout.id,
                    user_id=recipient.id
                )
                db.add(shoutout_recipient)
            
            # Add sample reactions
            for i, reaction_type in enumerate(shoutout_data["reactions"]):
                reactor_index = (shoutout_data["sender"].id + i) % len(all_users)
                reactor = all_users[reactor_index]
                
                # Make sure reactor is not the sender
                while reactor.id == shoutout_data["sender"].id:
                    reactor_index = (reactor_index + 1) % len(all_users)
                    reactor = all_users[reactor_index]
                
                reaction = Reaction(
                    shoutout_id=shoutout.id,
                    user_id=reactor.id,
                    reaction_type=ReactionType(reaction_type)
                )
                db.add(reaction)
            
            created_shoutouts.append(shoutout)
        
        db.commit()
        
        print(f"✅ Created {len(created_shoutouts)} sample shoutouts with reactions")
        
        print("\n📊 Database Summary:")
        print(f"   Departments: {db.query(Department).count()}")
        print(f"   Users: {db.query(User).count()}")
        print(f"   Shoutouts: {db.query(Shoutout).count()}")
        print(f"   Reactions: {db.query(Reaction).count()}")
        print("="*60)
        print("\nTest Login Credentials:")
        print("   Admin: admin@example.com / admin123")
        print("   Manager: jane@example.com / password123")
        print("   Employee: john@example.com / password123")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Error initializing data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Initialize data on startup
init_data()

# ========== AUTH ENDPOINTS ==========

@app.post("/api/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        department_id=user.department_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Update last login
    user.last_login = datetime.now()
    db.commit()
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

# ========== USER ENDPOINTS ==========

@app.get("/api/users/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    users = db.query(User).all()
    
    # Format response with department name
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department_id": user.department_id,
            "created_at": user.created_at,
            "department_name": user.department.name if user.department else None
        }
        result.append(user_dict)
    
    return result

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "department_id": user.department_id,
        "created_at": user.created_at,
        "department_name": user.department.name if user.department else None
    }

# ========== DEPARTMENT ENDPOINTS ==========

@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return [{"id": d.id, "name": d.name} for d in departments]

# ========== SHOUTOUT ENDPOINTS ==========

@app.post("/api/shoutouts", response_model=ShoutoutResponse)
def create_shoutout(
    shoutout: ShoutoutCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    new_shoutout = Shoutout(
        message=shoutout.message,
        sender_id=current_user.id,
        image_url=shoutout.image_url
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)
    
    for recipient_id in shoutout.recipient_ids:
        recipient = ShoutoutRecipient(
            shoutout_id=new_shoutout.id,
            user_id=recipient_id
        )
        db.add(recipient)
    
    db.commit()
    
    # Get sender info
    sender = db.query(User).filter(User.id == current_user.id).first()
    
    # Get recipients info
    recipients_data = []
    for recipient_id in shoutout.recipient_ids:
        user = db.query(User).filter(User.id == recipient_id).first()
        if user:
            recipients_data.append({
                "id": user.id, 
                "username": user.username,
                "email": user.email
            })
    
    return {
        "id": new_shoutout.id,
        "message": new_shoutout.message,
        "sender_id": current_user.id,
        "sender_name": sender.username,
        "sender_email": sender.email,
        "image_url": new_shoutout.image_url,
        "created_at": new_shoutout.created_at,
        "recipients": recipients_data,
        "reaction_counts": {"like": 0, "clap": 0, "star": 0},
        "user_reactions": []
    }

@app.get("/api/shoutouts", response_model=List[ShoutoutResponse])
def get_shoutouts(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    shoutouts = db.query(Shoutout).order_by(Shoutout.created_at.desc()).all()
    
    result = []
    for shoutout in shoutouts:
        sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        # Get recipients
        recipients = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.shoutout_id == shoutout.id
        ).all()
        recipient_data = []
        for rec in recipients:
            user = db.query(User).filter(User.id == rec.user_id).first()
            if user:
                recipient_data.append({
                    "id": user.id, 
                    "username": user.username,
                    "email": user.email
                })
        
        # Get reactions
        reactions = db.query(Reaction).filter(Reaction.shoutout_id == shoutout.id).all()
        reaction_counts = {"like": 0, "clap": 0, "star": 0}
        for reaction in reactions:
            reaction_counts[reaction.reaction_type.value] += 1
        
        # Get user's reactions
        user_reactions = []
        user_reaction = db.query(Reaction).filter(
            Reaction.shoutout_id == shoutout.id,
            Reaction.user_id == current_user.id
        ).first()
        if user_reaction:
            user_reactions.append({
                "user_id": user_reaction.user_id,
                "reaction_type": user_reaction.reaction_type.value
            })
        
        # Get comments count
        comments_count = db.query(Comment).filter(Comment.shoutout_id == shoutout.id).count()
        
        result.append({
            "id": shoutout.id,
            "message": shoutout.message,
            "sender_id": shoutout.sender_id,
            "sender_name": sender.username if sender else "Unknown",
            "sender_email": sender.email if sender else None,
            "image_url": shoutout.image_url,
            "created_at": shoutout.created_at,
            "recipients": recipient_data,
            "reaction_counts": reaction_counts,
            "user_reactions": user_reactions,
            "comment_count": comments_count
        })
    
    return result

@app.get("/api/shoutouts/{shoutout_id}", response_model=ShoutoutResponse)
def get_shoutout(shoutout_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    shoutout = db.query(Shoutout).filter(Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    sender = db.query(User).filter(User.id == shoutout.sender_id).first()
    
    # Get recipients
    recipients = db.query(ShoutoutRecipient).filter(
        ShoutoutRecipient.shoutout_id == shoutout.id
    ).all()
    recipient_data = []
    for rec in recipients:
        user = db.query(User).filter(User.id == rec.user_id).first()
        if user:
            recipient_data.append({
                "id": user.id, 
                "username": user.username,
                "email": user.email
            })
    
    # Get reactions
    reactions = db.query(Reaction).filter(Reaction.shoutout_id == shoutout.id).all()
    reaction_counts = {"like": 0, "clap": 0, "star": 0}
    for reaction in reactions:
        reaction_counts[reaction.reaction_type.value] += 1
    
    # Get user's reactions
    user_reactions = []
    user_reaction = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout.id,
        Reaction.user_id == current_user.id
    ).first()
    if user_reaction:
        user_reactions.append({
            "user_id": user_reaction.user_id,
            "reaction_type": user_reaction.reaction_type.value
        })
    
    # Get comments count
    comments_count = db.query(Comment).filter(Comment.shoutout_id == shoutout.id).count()
    
    return {
        "id": shoutout.id,
        "message": shoutout.message,
        "sender_id": shoutout.sender_id,
        "sender_name": sender.username if sender else "Unknown",
        "sender_email": sender.email if sender else None,
        "image_url": shoutout.image_url,
        "created_at": shoutout.created_at,
        "recipients": recipient_data,
        "reaction_counts": reaction_counts,
        "user_reactions": user_reactions,
        "comment_count": comments_count
    }

@app.delete("/api/shoutouts/{shoutout_id}")
def delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    shoutout = db.query(Shoutout).filter(Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    if current_user.role != "admin" and shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(shoutout)
    db.commit()
    
    return {"message": "Shoutout deleted successfully"}

# ========== REACTION ENDPOINTS ==========

@app.post("/api/shoutouts/{shoutout_id}/reactions")
def add_reaction(
    shoutout_id: int,
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    shoutout = db.query(Shoutout).filter(Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    existing_reaction = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id,
        Reaction.user_id == current_user.id
    ).first()
    
    if existing_reaction:
        existing_reaction.reaction_type = reaction.reaction_type
        db.commit()
        return {"message": "Reaction updated"}
    
    new_reaction = Reaction(
        shoutout_id=shoutout_id,
        user_id=current_user.id,
        reaction_type=reaction.reaction_type
    )
    db.add(new_reaction)
    db.commit()
    return {"message": "Reaction added"}

# ========== COMMENT ENDPOINTS ==========

@app.post("/api/shoutouts/{shoutout_id}/comments")
def add_comment(
    shoutout_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    shoutout = db.query(Shoutout).filter(Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    new_comment = Comment(
        text=comment_data.text,
        user_id=current_user.id,
        shoutout_id=shoutout_id,
        parent_id=comment_data.parent_id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {
        "id": new_comment.id,
        "text": new_comment.text,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_role": current_user.role,
        "parent_id": new_comment.parent_id,
        "created_at": new_comment.created_at,
        "is_edited": new_comment.is_edited,
        "replies": []
    }

@app.get("/api/shoutouts/{shoutout_id}/comments")
def get_comments(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    comments = db.query(Comment).filter(Comment.shoutout_id == shoutout_id, Comment.parent_id == None).all()
    
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        
        # Get replies
        replies = db.query(Comment).filter(Comment.parent_id == comment.id).all()
        replies_data = []
        for reply in replies:
            reply_user = db.query(User).filter(User.id == reply.user_id).first()
            replies_data.append({
                "id": reply.id,
                "text": reply.text,
                "user_id": reply.user_id,
                "username": reply_user.username if reply_user else "Unknown",
                "user_role": reply_user.role if reply_user else "employee",
                "parent_id": reply.parent_id,
                "created_at": reply.created_at,
                "is_edited": reply.is_edited
            })
        
        result.append({
            "id": comment.id,
            "text": comment.text,
            "user_id": comment.user_id,
            "username": user.username if user else "Unknown",
            "user_role": user.role if user else "employee",
            "parent_id": comment.parent_id,
            "created_at": comment.created_at,
            "is_edited": comment.is_edited,
            "replies": replies_data
        })
    
    return result

@app.put("/api/comments/{comment_id}")
def edit_comment(
    comment_id: int,
    comment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
    
    comment.text = comment_data["text"]
    comment.is_edited = True
    db.commit()
    
    return {"message": "Comment updated successfully"}

@app.delete("/api/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if current_user.role != "admin" and current_user.role != "manager" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}

# ========== REPORT ENDPOINTS ==========

@app.get("/api/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Get all reports (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view reports")
    
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    
    formatted_reports = []
    for report in reports:
        shoutout = db.query(Shoutout).filter(Shoutout.id == report.shoutout_id).first()
        reporter = db.query(User).filter(User.id == report.reporter_id).first()
        shoutout_sender = None
        
        if shoutout:
            shoutout_sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        formatted_reports.append({
            "id": report.id,
            "shoutout_id": report.shoutout_id,
            "reporter_id": report.reporter_id,
            "reporter_username": reporter.username if reporter else "Unknown",
            "reason": report.reason,
            "description": report.description,
            "status": report.status,
            "created_at": report.created_at,
            "resolved_at": report.resolved_at,
            "shoutout_message": shoutout.message if shoutout else None,
            "shoutout_sender_id": shoutout.sender_id if shoutout else None,
            "shoutout_sender_username": shoutout_sender.username if shoutout_sender else None,
        })
    
    return formatted_reports

@app.post("/api/reports")
def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    shoutout = db.query(Shoutout).filter(Shoutout.id == report_data.shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    # Check if user already reported this shoutout
    existing_report = db.query(Report).filter(
        Report.shoutout_id == report_data.shoutout_id,
        Report.reporter_id == current_user.id
    ).first()
    
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this shoutout")
    
    new_report = Report(
        shoutout_id=report_data.shoutout_id,
        reporter_id=current_user.id,
        reason=report_data.reason,
        description=report_data.description,
        status="pending"
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@app.post("/api/reports/{report_id}/resolve")
def resolve_report(
    report_id: int,
    resolution: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can resolve reports")
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    action = resolution.get("action")
    
    if action == "remove":
        shoutout = db.query(Shoutout).filter(Shoutout.id == report.shoutout_id).first()
        if shoutout:
            db.delete(shoutout)
        report.status = "resolved"
        report.resolved_at = datetime.now()
    elif action == "dismiss":
        report.status = "dismissed"
        report.resolved_at = datetime.now()
    
    db.commit()
    return {"message": f"Report {action}ed successfully"}

# ========== LEADERBOARD ENDPOINTS ==========

@app.get("/api/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    """Get leaderboard for all users"""
    leaderboard_data = calculate_leaderboard(db)
    
    # Format for frontend
    formatted_leaderboard = []
    for entry in leaderboard_data:
        formatted_leaderboard.append({
            "id": entry["id"],
            "username": entry["username"],
            "email": entry["email"],
            "department_name": entry["department_name"],
            "shoutouts_sent": entry["shoutouts_sent"],
            "shoutouts_received": entry["shoutouts_received"],
            "reactions_received": entry["reactions_received"],
            "score": entry["score"],
            "points": entry["score"]
        })
    
    return formatted_leaderboard

# ========== ADMIN ENDPOINTS ==========

@app.get("/api/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view stats")
    
    # Calculate dates for active users (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    total_shoutouts = db.query(Shoutout).count()
    total_reactions = db.query(Reaction).count()
    total_users = db.query(User).count()
    total_departments = db.query(Department).count()
    pending_reports = db.query(Report).filter(Report.status == "pending").count()
    
    # Active users (users who logged activity in last 7 days)
    active_users = db.query(User).filter(
        (User.last_login >= seven_days_ago) |
        (User.id.in_(
            db.query(Shoutout.sender_id).filter(Shoutout.created_at >= seven_days_ago)
        )) |
        (User.id.in_(
            db.query(Reaction.user_id).filter(Reaction.created_at >= seven_days_ago)
        ))
    ).distinct().count()
    
    # Calculate average reactions per shoutout
    avg_reactions = total_reactions / total_shoutouts if total_shoutouts > 0 else 0
    
    recent_shoutouts = db.query(Shoutout).order_by(
        Shoutout.created_at.desc()
    ).limit(5).all()
    
    # Top contributors
    users = db.query(User).all()
    top_contributors = []
    for user in users:
        shoutouts_sent = db.query(Shoutout).filter(Shoutout.sender_id == user.id).count()
        shoutouts_received = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.user_id == user.id
        ).count()
        
        if shoutouts_sent > 0 or shoutouts_received > 0:
            department_name = user.department.name if user.department else "No Department"
            top_contributors.append({
                "id": user.id,
                "username": user.username,
                "shoutouts_sent": shoutouts_sent,
                "shoutouts_received": shoutouts_received,
                "total_shoutouts": shoutouts_sent + shoutouts_received,
                "department": department_name
            })
    
    top_contributors.sort(key=lambda x: x["total_shoutouts"], reverse=True)
    
    # Most tagged users
    most_tagged = []
    for user in users:
        times_tagged = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.user_id == user.id
        ).count()
        
        if times_tagged > 0:
            department_name = user.department.name if user.department else "No Department"
            shoutouts_sent = db.query(Shoutout).filter(Shoutout.sender_id == user.id).count()
            most_tagged.append({
                "id": user.id,
                "username": user.username,
                "times_tagged": times_tagged,
                "department": department_name,
                "shoutouts_sent": shoutouts_sent
            })
    
    most_tagged.sort(key=lambda x: x["times_tagged"], reverse=True)
    
    # User growth (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    users_30_days_ago = db.query(User).filter(User.created_at < thirty_days_ago).count()
    user_growth = ((total_users - users_30_days_ago) / users_30_days_ago * 100) if users_30_days_ago > 0 else 100
    
    return {
        "total_shoutouts": total_shoutouts,
        "total_reactions": total_reactions,
        "total_users": total_users,
        "total_departments": total_departments,
        "active_users": active_users,
        "avg_reactions": round(avg_reactions, 2),
        "user_growth": round(user_growth, 2),
        "top_contributors": top_contributors[:10],
        "most_tagged_users": most_tagged[:10],
        "recent_shoutouts": [
            {
                "id": s.id,
                "message": s.message[:100] + "..." if len(s.message) > 100 else s.message,
                "sender": db.query(User).filter(User.id == s.sender_id).first().username,
                "created_at": s.created_at.isoformat()
            }
            for s in recent_shoutouts
        ],
        "pending_reports": pending_reports
    }

# ========== EXPORT ENDPOINTS ==========

@app.get("/api/export/shoutouts/csv")
def export_shoutouts_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")
    
    shoutouts = db.query(Shoutout).order_by(Shoutout.created_at.desc()).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Message", "Sender", "Recipients", "Reactions", "Image", "Created At"])
    
    for shoutout in shoutouts:
        sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        recipients = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.shoutout_id == shoutout.id
        ).all()
        recipient_names = []
        for rec in recipients:
            user = db.query(User).filter(User.id == rec.user_id).first()
            if user:
                recipient_names.append(user.username)
        
        reactions = db.query(Reaction).filter(Reaction.shoutout_id == shoutout.id).all()
        reaction_counts = {"like": 0, "clap": 0, "star": 0}
        for reaction in reactions:
            reaction_counts[reaction.reaction_type.value] += 1
        
        writer.writerow([
            shoutout.id,
            shoutout.message[:200] + "..." if len(shoutout.message) > 200 else shoutout.message,
            sender.username if sender else "Unknown",
            ", ".join(recipient_names),
            f"👍 {reaction_counts['like']} 👏 {reaction_counts['clap']} ⭐ {reaction_counts['star']}",
            "Yes" if shoutout.image_url else "No",
            shoutout.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    csv_content = output.getvalue()
    
    # Return as downloadable file
    return JSONResponse({
        "filename": f"shoutouts_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        "content": csv_content,
        "content_type": "text/csv"
    })

@app.get("/api/export/users/csv")
def export_users_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")
    
    users = db.query(User).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Username", "Email", "Role", "Department", "Shoutouts Sent", "Shoutouts Received", "Joined At"])
    
    for user in users:
        shoutouts_sent = db.query(Shoutout).filter(Shoutout.sender_id == user.id).count()
        shoutouts_received = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.user_id == user.id
        ).count()
        
        department_name = user.department.name if user.department else "No Department"
        
        writer.writerow([
            user.id,
            user.username,
            user.email,
            user.role,
            department_name,
            shoutouts_sent,
            shoutouts_received,
            user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    csv_content = output.getvalue()
    
    return JSONResponse({
        "filename": f"users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        "content": csv_content,
        "content_type": "text/csv"
    })

@app.get("/api/export/leaderboard/csv")
def export_leaderboard_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export data")
    
    leaderboard = calculate_leaderboard(db)
    
    output = StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Rank", "Username", "Email", "Department", "Shoutouts Sent", "Shoutouts Received", "Reactions Received", "Points"])
    
    for i, user in enumerate(leaderboard, 1):
        writer.writerow([
            i,
            user["username"],
            user["email"],
            user["department_name"] or "No Department",
            user["shoutouts_sent"],
            user["shoutouts_received"],
            user["reactions_received"],
            user["score"]
        ])
    
    output.seek(0)
    csv_content = output.getvalue()
    
    return JSONResponse({
        "filename": f"leaderboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        "content": csv_content,
        "content_type": "text/csv"
    })

# ========== PDF EXPORT ENDPOINTS ==========

def create_shoutouts_pdf(shoutouts_data):
    """Create PDF for shoutouts"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='Left', alignment=TA_LEFT))
    
    story = []
    
    # Title
    title = Paragraph("<b>BragBoard - Shoutouts Report</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Date
    date_str = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    story.append(date_str)
    story.append(Spacer(1, 24))
    
    # Summary
    summary = Paragraph(f"<b>Total Shoutouts:</b> {len(shoutouts_data)}", styles['Normal'])
    story.append(summary)
    story.append(Spacer(1, 12))
    
    # Table data
    table_data = [["ID", "Sender", "Message", "Recipients", "Date"]]
    
    for shoutout in shoutouts_data:
        table_data.append([
            str(shoutout["id"]),
            shoutout["sender"],
            shoutout["message"][:100] + "..." if len(shoutout["message"]) > 100 else shoutout["message"],
            shoutout["recipients"],
            shoutout["date"]
        ])
    
    # Create table
    table = Table(table_data, colWidths=[50, 80, 200, 100, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Footer
    footer = Paragraph("<i>BragBoard - Celebrating Success Together</i>", styles['Italic'])
    story.append(footer)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def create_leaderboard_pdf(leaderboard_data):
    """Create PDF for leaderboard"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER))
    
    story = []
    
    # Title
    title = Paragraph("<b>BragBoard - Leaderboard Report</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Date
    date_str = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    story.append(date_str)
    story.append(Spacer(1, 24))
    
    # Create chart image
    fig, ax = plt.subplots(figsize=(8, 4))
    users = [entry["username"][:15] for entry in leaderboard_data[:10]]
    scores = [entry["score"] for entry in leaderboard_data[:10]]
    
    bars = ax.barh(users, scores, color=['gold', 'silver', '#CD7F32'] + ['skyblue'] * 7)
    ax.set_xlabel('Points')
    ax.set_title('Top 10 Contributors')
    ax.invert_yaxis()
    
    # Save chart to buffer
    chart_buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(chart_buffer, format='png', dpi=100)
    plt.close()
    chart_buffer.seek(0)
    
    # Add chart to PDF
    story.append(Paragraph("<b>Top Contributors Chart</b>", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    # Table data
    table_data = [["Rank", "Username", "Department", "Shoutouts", "Reactions", "Points"]]
    
    for i, entry in enumerate(leaderboard_data[:20], 1):
        table_data.append([
            str(i),
            entry["username"],
            entry["department_name"] or "N/A",
            str(entry["shoutouts_sent"] + entry["shoutouts_received"]),
            str(entry["reactions_received"]),
            str(entry["score"])
        ])
    
    # Create table
    table = Table(table_data, colWidths=[40, 100, 100, 70, 70, 60])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (0, 3), colors.HexColor('#FFD700')),  # Gold
        ('BACKGROUND', (0, 4), (0, 4), colors.HexColor('#C0C0C0')),  # Silver
        ('BACKGROUND', (0, 5), (0, 5), colors.HexColor('#CD7F32')),  # Bronze
        ('BACKGROUND', (0, 6), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Statistics
    stats_text = f"""
    <b>Statistics:</b><br/>
    Total Users on Leaderboard: {len(leaderboard_data)}<br/>
    Average Points: {sum(entry['score'] for entry in leaderboard_data) / len(leaderboard_data):.1f}<br/>
    Top Score: {leaderboard_data[0]['score'] if leaderboard_data else 0}<br/>
    """
    stats = Paragraph(stats_text, styles['Normal'])
    story.append(stats)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def create_reports_pdf(reports_data):
    """Create PDF for reports"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    
    styles = getSampleStyleSheet()
    
    story = []
    
    # Title
    title = Paragraph("<b>BragBoard - Reports Analysis</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Date
    date_str = Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal'])
    story.append(date_str)
    story.append(Spacer(1, 24))
    
    # Summary
    pending = len([r for r in reports_data if r["status"] == "pending"])
    resolved = len([r for r in reports_data if r["status"] == "resolved"])
    dismissed = len([r for r in reports_data if r["status"] == "dismissed"])
    
    summary = Paragraph(
        f"<b>Report Summary:</b><br/>"
        f"Total Reports: {len(reports_data)}<br/>"
        f"Pending: {pending}<br/>"
        f"Resolved: {resolved}<br/>"
        f"Dismissed: {dismissed}",
        styles['Normal']
    )
    story.append(summary)
    story.append(Spacer(1, 20))
    
    # Table data
    table_data = [["ID", "Shoutout ID", "Reporter", "Reason", "Status", "Date"]]
    
    for report in reports_data:
        table_data.append([
            str(report["id"]),
            str(report["shoutout_id"]),
            report["reporter_username"],
            report["reason"][:30] + "..." if len(report["reason"]) > 30 else report["reason"],
            report["status"],
            report["created_at"].strftime("%Y-%m-%d") if hasattr(report["created_at"], 'strftime') else report["created_at"]
        ])
    
    # Create table
    table = Table(table_data, colWidths=[40, 60, 80, 150, 60, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    story.append(table)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

@app.get("/api/export/shoutouts/pdf")
async def export_shoutouts_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Export shoutouts as PDF"""
    shoutouts = db.query(Shoutout).order_by(Shoutout.created_at.desc()).all()
    
    # Prepare data for PDF
    shoutouts_data = []
    for shoutout in shoutouts:
        sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        # Get recipients
        recipients = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.shoutout_id == shoutout.id
        ).all()
        recipient_names = []
        for rec in recipients:
            user = db.query(User).filter(User.id == rec.user_id).first()
            if user:
                recipient_names.append(user.username)
        
        shoutouts_data.append({
            "id": shoutout.id,
            "message": shoutout.message,
            "sender": sender.username if sender else "Unknown",
            "recipients": ", ".join(recipient_names) if recipient_names else "No recipients",
            "date": shoutout.created_at.strftime("%Y-%m-%d")
        })
    
    pdf_buffer = create_shoutouts_pdf(shoutouts_data)
    
    headers = {
        'Content-Disposition': f'attachment; filename="shoutouts_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    }
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers=headers
    )

@app.get("/api/export/leaderboard/pdf")
async def export_leaderboard_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Export leaderboard as PDF"""
    leaderboard_data = calculate_leaderboard(db)
    
    pdf_buffer = create_leaderboard_pdf(leaderboard_data)
    
    headers = {
        'Content-Disposition': f'attachment; filename="leaderboard_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    }
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers=headers
    )

@app.get("/api/export/reports/pdf")
async def export_reports_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Export reports as PDF (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can export reports")
    
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    
    # Prepare data for PDF
    reports_data = []
    for report in reports:
        reporter = db.query(User).filter(User.id == report.reporter_id).first()
        
        reports_data.append({
            "id": report.id,
            "shoutout_id": report.shoutout_id,
            "reporter_username": reporter.username if reporter else "Unknown",
            "reason": report.reason,
            "status": report.status,
            "created_at": report.created_at
        })
    
    pdf_buffer = create_reports_pdf(reports_data)
    
    headers = {
        'Content-Disposition': f'attachment; filename="reports_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    }
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers=headers
    )

# ========== USER MANAGEMENT ENDPOINTS ==========

@app.put("/api/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update user roles")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    valid_roles = ["employee", "manager", "admin"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    user.role = role_data.role
    db.commit()
    
    return {"message": f"User role updated to {role_data.role}"}

@app.delete("/api/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@app.get("/api/users/{user_id}/stats", response_model=UserStatsResponse)
def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    shoutouts_sent = db.query(Shoutout).filter(Shoutout.sender_id == user_id).count()
    shoutouts_received = db.query(ShoutoutRecipient).filter(
        ShoutoutRecipient.user_id == user_id
    ).count()
    reactions_given = db.query(Reaction).filter(Reaction.user_id == user_id).count()
    reactions_received = db.query(Reaction).join(Shoutout).filter(
        Shoutout.sender_id == user_id
    ).count()
    
    recent_shoutouts = db.query(Shoutout).filter(
        Shoutout.sender_id == user_id
    ).order_by(Shoutout.created_at.desc()).limit(5).all()
    
    recent_shoutouts_data = []
    for shoutout in recent_shoutouts:
        shoutout_reactions = db.query(Reaction).filter(
            Reaction.shoutout_id == shoutout.id
        ).count()
        
        recent_shoutouts_data.append({
            "id": shoutout.id,
            "message": shoutout.message[:100] + "..." if len(shoutout.message) > 100 else shoutout.message,
            "created_at": shoutout.created_at.isoformat(),
            "reaction_count": shoutout_reactions
        })
    
    return {
        "user_id": user_id,
        "username": user.username,
        "stats": {
            "shoutouts_sent": shoutouts_sent,
            "shoutouts_received": shoutouts_received,
            "reactions_given": reactions_given,
            "reactions_received": reactions_received,
            "total_points": (shoutouts_received * 10) + (reactions_received * 5)
        },
        "recent_activity": recent_shoutouts_data
    }

# ========== IMAGE UPLOAD ==========

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/api/upload-image")
def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(auth.get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File must be an image")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split(".")[-1]
    filename = f"{timestamp}_{current_user.id}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    return {"image_url": f"/uploads/{filename}"}

@app.get("/uploads/{filename}")
def get_image(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

# ========== HEALTH CHECK ==========
@app.get("/")
def read_root():
    return {"message": "Welcome to BragBoard API", "version": "1.0.0"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "BragBoard API"
    }

# ========== DASHBOARD ENDPOINTS ==========

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Get dashboard statistics for the current user"""
    
    # User's shoutouts sent
    shoutouts_sent = db.query(Shoutout).filter(
        Shoutout.sender_id == current_user.id
    ).count()
    
    # User's shoutouts received
    shoutouts_received = db.query(ShoutoutRecipient).filter(
        ShoutoutRecipient.user_id == current_user.id
    ).count()
    
    # User's reactions given
    reactions_given = db.query(Reaction).filter(
        Reaction.user_id == current_user.id
    ).count()
    
    # Recent shoutouts involving the user
    recent_shoutouts = db.query(Shoutout).filter(
        (Shoutout.sender_id == current_user.id) |
        (Shoutout.id.in_(
            db.query(ShoutoutRecipient.shoutout_id).filter(
                ShoutoutRecipient.user_id == current_user.id
            )
        ))
    ).order_by(Shoutout.created_at.desc()).limit(5).all()
    
    recent_shoutouts_data = []
    for shoutout in recent_shoutouts:
        sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        # Check if user is a recipient
        is_recipient = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.shoutout_id == shoutout.id,
            ShoutoutRecipient.user_id == current_user.id
        ).first() is not None
        
        recent_shoutouts_data.append({
            "id": shoutout.id,
            "message": shoutout.message[:100] + "..." if len(shoutout.message) > 100 else shoutout.message,
            "sender": sender.username if sender else "Unknown",
            "is_recipient": is_recipient,
            "created_at": shoutout.created_at.isoformat()
        })
    
    # User's department stats
    department_stats = {}
    if current_user.department:
        department_shoutouts = db.query(Shoutout).join(User).filter(
            User.department_id == current_user.department_id
        ).count()
        
        department_users = db.query(User).filter(
            User.department_id == current_user.department_id
        ).count()
        
        department_stats = {
            "name": current_user.department.name,
            "total_shoutouts": department_shoutouts,
            "total_users": department_users
        }
    
    return {
        "user_stats": {
            "shoutouts_sent": shoutouts_sent,
            "shoutouts_received": shoutouts_received,
            "reactions_given": reactions_given,
            "total_points": (shoutouts_received * 10) + (reactions_given * 2)
        },
        "department_stats": department_stats,
        "recent_shoutouts": recent_shoutouts_data
    }

# ========== ERROR HANDLERS ==========

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )

# ========== APPLICATION STARTUP ==========

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("BragBoard API Starting...")
    print("="*60)
    print("Admin Interface: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Alternative Docs: http://localhost:8000/redoc")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )