from sqlalchemy.orm import Session
from app.models import Reaction
from app.schemas.reaction import ReactionCreate, ReactionType

def create_reaction(db: Session, reaction: ReactionCreate, shoutout_id: int, user_id: int):
    # Check if reaction already exists
    existing_reaction = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id,
        Reaction.user_id == user_id,
        Reaction.type == reaction.type
    ).first()

    if existing_reaction:
        # Toggle off: delete if exists
        db.delete(existing_reaction)
        db.commit()
        return None  # Indicate removal
    else:
        # Create new reaction
        db_reaction = Reaction(
            shoutout_id=shoutout_id,
            user_id=user_id,
            type=reaction.type
        )
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        return db_reaction

def get_reactions_count(db: Session, shoutout_id: int):
    reactions = db.query(Reaction).filter(Reaction.shoutout_id == shoutout_id).all()
    counts = {
        "like": 0,
        "clap": 0,
        "star": 0
    }
    for r in reactions:
        if r.type in counts:
            counts[r.type] += 1
    return counts

def get_user_reactions(db: Session, shoutout_id: int, user_id: int):
    reactions = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id, 
        Reaction.user_id == user_id
    ).all()
    return [r.type for r in reactions]
