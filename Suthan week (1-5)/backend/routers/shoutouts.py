from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any
from database import get_db
import models, schemas, auth

router = APIRouter(
    prefix="/api/shoutouts",
    tags=["ShoutOuts"]
)

def get_shoutout_query(db: Session):
    """Base query with all relationships loaded"""
    return db.query(models.ShoutOut).options(
        joinedload(models.ShoutOut.sender).joinedload(models.User.department),
        joinedload(models.ShoutOut.recipients).joinedload(models.ShoutOutRecipient.recipient).joinedload(models.User.department),
        joinedload(models.ShoutOut.reactions)
    )

def enrich_shoutout(shoutout: models.ShoutOut, current_user_id: int):
    """Process reactions to add count and user status"""
    counts = {}
    user_reactions = []
    
    # Ensure reactions are loaded
    if shoutout.reactions:
        for r in shoutout.reactions:
            # r.type is an Enum, get the value (string)
            r_type = r.type.value if hasattr(r.type, 'value') else r.type
            counts[r_type] = counts.get(r_type, 0) + 1
            if r.user_id == current_user_id:
                user_reactions.append(r_type)
    
    # Set attributes for Pydantic to pick up
    shoutout.reaction_counts = counts
    shoutout.current_user_reactions = user_reactions
    return shoutout

# ... existing code ...

@router.post("/{id}/react", response_model=schemas.ShoutOutResponse)
def react_to_shoutout(
    id: int,
    reaction_data: schemas.ReactionBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Toggle reaction: Add if not exists, Remove if exists. Supports multiple types."""
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
        
    # Check for THIS specific reaction type from this user
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == id,
        models.Reaction.user_id == current_user.id,
        models.Reaction.type == reaction_data.type
    ).first()
    
    if existing_reaction:
        # If exists, remove it (toggle off)
        db.delete(existing_reaction)
    else:
        # If not exists, add it (toggle on)
        new_reaction = models.Reaction(
            shoutout_id=id,
            user_id=current_user.id,
            type=reaction_data.type
        )
        db.add(new_reaction)
        
    db.commit()
    
    # Reload and return updated shoutout
    updated_shoutout = get_shoutout_query(db).filter(models.ShoutOut.id == id).first()
    return enrich_shoutout(updated_shoutout, current_user.id)

@router.post("/", response_model=schemas.ShoutOutResponse)
def create_shoutout(
    shoutout: schemas.ShoutOutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # 1. Create the main post/shoutout
        from datetime import datetime, timezone
        # Convert empty strings to None for optional fields
        title = shoutout.title.strip() if shoutout.title else None
        image_url = shoutout.image_url.strip() if shoutout.image_url else None
        tags = shoutout.tags.strip() if shoutout.tags else None
        
        new_shoutout = models.ShoutOut(
            sender_id=current_user.id,
            message=shoutout.message.strip(),
            title=title if title else None,
            image_url=image_url if image_url else None,
            tags=tags if tags else None
        )
        db.add(new_shoutout)
        db.flush() # Get the ID for recipients

        # 2. Add recipients
        for r_id in shoutout.recipient_ids:
            recipient = db.query(models.User).filter(models.User.id == r_id).first()
            if not recipient:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Recipient user {r_id} not found")
            
            db_recipient = models.ShoutOutRecipient(
                shoutout_id=new_shoutout.id,
                recipient_id=r_id
            )
            db.add(db_recipient)
        
        db.commit()
        shoutout_id = new_shoutout.id
        
        # Reload with all relationships to ensure Pydantic response_model is fully satisfied
        # Query fresh from database to get all database-generated values
        final_shoutout = get_shoutout_query(db).filter(models.ShoutOut.id == shoutout_id).first()
        
        if not final_shoutout:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created shoutout"
            )
        
        # Ensure created_at is set if database default didn't work
        if final_shoutout.created_at is None:
            final_shoutout.created_at = datetime.now(timezone.utc)
            db.commit()
            # Re-query after fixing created_at
            final_shoutout = get_shoutout_query(db).filter(models.ShoutOut.id == shoutout_id).first()
            if not final_shoutout:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve created shoutout after update"
                )
        
        return enrich_shoutout(final_shoutout, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error creating shoutout: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/", response_model=List[schemas.ShoutOutResponse])
def get_shoutouts(
    department_id: int = None,
    sender_id: int = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = get_shoutout_query(db)

    # 1. Filter by Department (of the SENDER)
    if department_id:
        query = query.join(models.User, models.ShoutOut.sender_id == models.User.id)\
                     .filter(models.User.department_id == department_id)
    
    # 2. Filter by Sender
    if sender_id:
        query = query.filter(models.ShoutOut.sender_id == sender_id)

    # 3. Filter by Date
    if date_from:
        # Assuming date string YYYY-MM-DD
        from datetime import datetime
        try:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(models.ShoutOut.created_at >= date_from_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")
    
    if date_to:
        # Assuming date string YYYY-MM-DD
        from datetime import datetime, timedelta
        try:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(models.ShoutOut.created_at < date_to_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")

    results = query.order_by(models.ShoutOut.created_at.desc()).all()
    return [enrich_shoutout(s, current_user.id) for s in results]

@router.get("/received", response_model=List[schemas.ShoutOutResponse])
def get_received_shoutouts(
    unviewed_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get shoutouts where the current user is a recipient"""
    query = get_shoutout_query(db).join(
        models.ShoutOutRecipient,
        models.ShoutOut.id == models.ShoutOutRecipient.shoutout_id
    ).filter(
        models.ShoutOutRecipient.recipient_id == current_user.id
    )
    
    # Filter unviewed only if requested (for count)
    if unviewed_only:
        query = query.filter(
            (models.ShoutOutRecipient.viewed == None) | (models.ShoutOutRecipient.viewed == 'false')
        )
    
    results = query.order_by(models.ShoutOut.created_at.desc()).all()
    return [enrich_shoutout(s, current_user.id) for s in results]

@router.put("/{id}/mark-viewed", status_code=status.HTTP_204_NO_CONTENT)
def mark_shoutout_viewed(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mark a shout-out as viewed by the current user"""
    recipient_entry = db.query(models.ShoutOutRecipient).filter(
        models.ShoutOutRecipient.shoutout_id == id,
        models.ShoutOutRecipient.recipient_id == current_user.id
    ).first()
    
    if not recipient_entry:
        raise HTTPException(status_code=404, detail="Shout-out not found for this user")
    
    recipient_entry.viewed = 'true'
    db.commit()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shoutout(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    # Allow deletion if user is sender OR admin (optional, sticking to sender for now)
    if shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    db.delete(shoutout)
    db.commit()

@router.post("/{id}/react", response_model=schemas.ShoutOutResponse)
def react_to_shoutout(
    id: int,
    reaction_data: schemas.ReactionBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Toggle reaction: Add if not exists, Remove if exists. Supports multiple types."""
    shoutout = db.query(models.ShoutOut).filter(models.ShoutOut.id == id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
        
    # Check for THIS specific reaction type from this user
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.shoutout_id == id,
        models.Reaction.user_id == current_user.id,
        models.Reaction.type == reaction_data.type
    ).first()
    
    if existing_reaction:
        # If exists, remove it (toggle off)
        db.delete(existing_reaction)
    else:
        # If not exists, add it (toggle on)
        new_reaction = models.Reaction(
            shoutout_id=id,
            user_id=current_user.id,
            type=reaction_data.type
        )
        db.add(new_reaction)

        # Create Notification for the Shoutout Sender
        if shoutout.sender_id != current_user.id:
            notification = models.Notification(
                recipient_id=shoutout.sender_id,
                actor_id=current_user.id,
                type='reaction',
                message=f"reacted to your shoutout with {reaction_data.type}",
                reference_id=shoutout.id
            )
            db.add(notification)
        
    db.commit()
    
    # Reload and return updated shoutout
    updated_shoutout = get_shoutout_query(db).filter(models.ShoutOut.id == id).first()
    return enrich_shoutout(updated_shoutout, current_user.id)
