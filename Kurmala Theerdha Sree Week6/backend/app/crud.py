from sqlalchemy.orm import Session, joinedload
import bcrypt
from typing import List
from datetime import datetime
import os
import uuid
from pathlib import Path

from . import models, schemas


# ---------------- INTERNAL UTILS ----------------

def _truncate_password(password: str) -> str:
    """
    Safely truncate password to <= 70 characters (well under 72 byte limit for bcrypt).
    Bcrypt has a 72 byte limit, so we truncate at character level to be safe.
    """
    if len(password) > 70:
        return password[:70]
    return password


# ---------------- AUTH / USERS ----------------

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    # Truncate password to safe length before hashing
    truncated_password = _truncate_password(user.password)

    # Hash password with bcrypt
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(
        truncated_password.encode("utf-8"),
        salt
    ).decode("utf-8")

    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed,
        department=user.department
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    truncated_password = _truncate_password(plain_password)
    return bcrypt.checkpw(
        truncated_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def get_all_departments(db: Session):
    """Get all unique departments from registered users"""
    departments = db.query(models.User.department).distinct().all()
    return [dept[0] for dept in departments if dept[0]]


def get_all_users(db: Session):
    """Get all users in the application"""
    return db.query(models.User).all()


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    """Update user profile information"""
    db_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not db_user:
        return None

    if user_update.name is not None:
        db_user.name = user_update.name

    if user_update.email is not None:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != user_id
        ).first()

        if existing_user:
            raise ValueError("Email already in use")

        db_user.email = user_update.email

    if user_update.department is not None:
        db_user.department = user_update.department

    db.commit()
    db.refresh(db_user)
    return db_user


def get_department_members(db: Session, department: str):
    """Get all users in a department"""
    return db.query(models.User).filter(models.User.department == department).all()


def get_department_stats(db: Session, department: str):
    """Get statistics for a department"""
    members = db.query(models.User).filter(models.User.department == department).all()
    total_members = len(members)
    admin_count = sum(1 for m in members if m.role == "admin")
    employee_count = sum(1 for m in members if m.role == "employee")
    total_brags = db.query(models.Brag).join(models.User).filter(models.User.department == department).count()
    
    return {
        "department": department,
        "total_members": total_members,
        "admin_count": admin_count,
        "employee_count": employee_count,
        "total_brags": total_brags,
        "avg_brags_per_member": total_brags / total_members if total_members > 0 else 0
    }


def get_department_activity(db: Session, department: str, limit: int = 10):
    """Get recent activity from a department"""
    activities = []
    
    # Recent brags
    recent_brags = db.query(models.Brag).join(models.User).filter(
        models.User.department == department
    ).order_by(
        models.Brag.created_at.desc()
    ).limit(limit).all()
    
    for brag in recent_brags:
        activities.append({
            "type": "brag",
            "id": brag.id,
            "content": brag.content[:50] + "..." if len(brag.content) > 50 else brag.content,
            "author": brag.author.name,
            "timestamp": brag.created_at.isoformat(),
            "recipients_count": len(brag.recipients)
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]


# ---------------- BRAGS ----------------

def save_attachment(db: Session, file, brag_id: int, upload_dir: str = None):
    """Save an uploaded file as an attachment"""
    # Use absolute path to uploads directory relative to backend directory
    if upload_dir is None:
        # Get the directory where this script is located (backend/app)
        current_dir = Path(__file__).parent
        # Go up one level to get to backend directory
        backend_dir = current_dir.parent
        upload_dir = backend_dir / "uploads"
    
    upload_path = Path(upload_dir)
    upload_path.mkdir(exist_ok=True)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_path / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Create attachment record
    db_attachment = models.Attachment(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        content_type=file.content_type,
        brag_id=brag_id
    )

    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment

def create_brag(db: Session, brag: schemas.BragCreate, author_id: int):
    """Create a new brag with recipients"""
    db_brag = models.Brag(
        content=brag.content,
        author_id=author_id
    )

    db.add(db_brag)
    db.commit()
    db.refresh(db_brag)

    # Attach recipients
    for recipient_id in brag.recipient_ids:
        recipient = db.query(models.User).filter(
            models.User.id == recipient_id
        ).first()

        if recipient:
            db_brag.recipients.append(recipient)

    db.commit()
    db.refresh(db_brag)
    return db_brag


def get_user_brags(db: Session, user_id: int):
    """Get all brags authored by a user"""
    return db.query(models.Brag).options(
        joinedload(models.Brag.author),
        joinedload(models.Brag.recipients),
        joinedload(models.Brag.attachments),
        joinedload(models.Brag.reactions).joinedload(models.Reaction.user),
        joinedload(models.Brag.comments).joinedload(models.Comment.user)
    ).filter(
        models.Brag.author_id == user_id
    ).all()


def get_brags_for_user(db: Session, user_id: int):
    """Get all brags where user is a recipient"""
    return db.query(models.Brag).options(
        joinedload(models.Brag.author),
        joinedload(models.Brag.recipients),
        joinedload(models.Brag.attachments),
        joinedload(models.Brag.reactions).joinedload(models.Reaction.user),
        joinedload(models.Brag.comments).joinedload(models.Comment.user)
    ).filter(
        models.Brag.recipients.any(id=user_id)
    ).all()


def get_all_brags(db: Session, limit: int = 50, department: str = None, sender: str = None, date_from: str = None, date_to: str = None):
    """Get all brags for feed with optional filtering"""
    query = db.query(models.Brag).options(
        joinedload(models.Brag.author),
        joinedload(models.Brag.recipients),
        joinedload(models.Brag.attachments),
        joinedload(models.Brag.reactions).joinedload(models.Reaction.user),
        joinedload(models.Brag.comments).joinedload(models.Comment.user)
    )

    # Apply filters
    if department:
        query = query.join(models.Brag.author).filter(models.User.department == department)

    if sender:
        try:
            sender_id = int(sender)
            query = query.filter(models.Brag.author_id == sender_id)
        except ValueError:
            # If sender is not a number, treat it as name search
            query = query.join(models.Brag.author).filter(models.User.name.ilike(f"%{sender}%"))

    if date_from:
        try:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(models.Brag.created_at >= date_from_obj)
        except ValueError:
            pass  # Invalid date format, skip filter

    if date_to:
        try:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(models.Brag.created_at <= date_to_obj)
        except ValueError:
            pass  # Invalid date format, skip filter

    return query.order_by(
        models.Brag.created_at.desc()
    ).limit(limit).all()


# ---------------- REACTIONS ----------------

def add_reaction(db: Session, brag_id: int, user_id: int, reaction_type: schemas.ReactionType):
    """Add a reaction to a brag. If user already reacted, update the type."""
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.brag_id == brag_id,
        models.Reaction.user_id == user_id
    ).first()

    if existing_reaction:
        existing_reaction.reaction_type = reaction_type
        db.commit()
        db.refresh(existing_reaction)
        return existing_reaction
    else:
        db_reaction = models.Reaction(
            brag_id=brag_id,
            user_id=user_id,
            reaction_type=reaction_type
        )
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        return db_reaction


def remove_reaction(db: Session, brag_id: int, user_id: int):
    """Remove a user's reaction from a brag"""
    reaction = db.query(models.Reaction).filter(
        models.Reaction.brag_id == brag_id,
        models.Reaction.user_id == user_id
    ).first()

    if reaction:
        db.delete(reaction)
        db.commit()
        return True
    return False


def get_reactions_for_brag(db: Session, brag_id: int):
    """Get all reactions for a brag"""
    return db.query(models.Reaction).options(
        joinedload(models.Reaction.user)
    ).filter(
        models.Reaction.brag_id == brag_id
    ).all()


# ---------------- COMMENTS ----------------

def create_comment(db: Session, brag_id: int, user_id: int, comment: schemas.CommentCreate):
    """Create a new comment on a brag"""
    db_comment = models.Comment(
        brag_id=brag_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_comments_for_brag(db: Session, brag_id: int):
    """Get all comments for a brag"""
    return db.query(models.Comment).options(
        joinedload(models.Comment.user)
    ).filter(
        models.Comment.brag_id == brag_id
    ).order_by(models.Comment.created_at.asc()).all()


def delete_comment(db: Session, comment_id: int, user_id: int):
    """Delete a comment (only by the author)"""
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.user_id == user_id
    ).first()
    
    if comment:
        db.delete(comment)
        db.commit()
        return True
    return False
