# app/routers/leaderboard_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import crud, schemas
from ..deps import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/global", response_model=List[schemas.LeaderboardStats])
async def get_global_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get global leaderboard with top users by total points"""
    try:
        entries = crud.get_leaderboard_with_user_info(db, limit=limit)
        
        result = []
        for idx, entry in enumerate(entries, 1):
            if entry.user:  # Ensure user relationship is loaded
                result.append(schemas.LeaderboardStats(
                    rank=idx,
                    user_id=entry.user_id,
                    name=entry.user.name,
                    department=entry.user.department or "N/A",
                    brags_sent=entry.brags_sent,
                    appreciations_received=entry.appreciations_received,
                    reactions_given=entry.reactions_given,
                    total_points=entry.total_points,
                    last_updated=entry.last_updated
                ))
        
        return result
    except Exception as e:
        print(f"Error fetching global leaderboard: {e}")
        return []


@router.get("/department", response_model=List[schemas.LeaderboardStats])
async def get_department_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get leaderboard for current user's department"""
    if not current_user.department:
        raise HTTPException(status_code=400, detail="User does not have a department assigned")
    
    try:
        entries = crud.get_leaderboard_by_department(db, current_user.department, limit=limit)
        
        result = []
        for idx, entry in enumerate(entries, 1):
            if entry.user:  # Ensure user relationship is loaded
                result.append(schemas.LeaderboardStats(
                    rank=idx,
                    user_id=entry.user_id,
                    name=entry.user.name,
                    department=entry.user.department or "N/A",
                    brags_sent=entry.brags_sent,
                    appreciations_received=entry.appreciations_received,
                    reactions_given=entry.reactions_given,
                    total_points=entry.total_points,
                    last_updated=entry.last_updated
                ))
        
        return result
    except Exception as e:
        print(f"Error fetching department leaderboard: {e}")
        return []


@router.get("/me", response_model=dict)
async def get_my_leaderboard_info(
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get current user's leaderboard information including rank"""
    try:
        entry = crud.get_or_create_leaderboard_entry(db, current_user.id)
        # Always update points to ensure current data
        crud.update_leaderboard_points(db, current_user.id)
        rank = crud.get_user_leaderboard_rank(db, current_user.id)
        
        return {
            "rank": rank,
            "user_id": entry.user_id,
            "brags_sent": entry.brags_sent,
            "appreciations_received": entry.appreciations_received,
            "reactions_given": entry.reactions_given,
            "total_points": entry.total_points,
            "last_updated": entry.last_updated
        }
    except Exception as e:
        print(f"Error fetching user leaderboard info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard info")


@router.get("/user/{user_id}", response_model=dict)
async def get_user_leaderboard_info(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    """Get specific user's leaderboard information"""
    entry = crud.get_or_create_leaderboard_entry(db, user_id)
    
    if not entry:
        raise HTTPException(status_code=404, detail="User not found")
    
    rank = crud.get_user_leaderboard_rank(db, user_id)
    
    return {
        "rank": rank,
        "user_id": entry.user_id,
        "brags_sent": entry.brags_sent,
        "appreciations_received": entry.appreciations_received,
        "reactions_given": entry.reactions_given,
        "total_points": entry.total_points,
        "last_updated": entry.last_updated
    }
