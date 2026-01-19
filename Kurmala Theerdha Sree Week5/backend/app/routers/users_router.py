# app/routers/users_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas
from ..deps import get_db, get_current_user
from .. import models
from .. import crud

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_current_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user information"""
    try:
        updated_user = crud.update_user(db, current_user.id, user_update)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/departments", response_model=list[str])
def get_all_departments(
    db: Session = Depends(get_db)
):
    """Get all unique departments from registered users"""
    return crud.get_all_departments(db)

@router.get("/all", response_model=list[schemas.UserOut])
def get_all_users(
    db: Session = Depends(get_db)
):
    """Get all users in the application"""
    return crud.get_all_users(db)

@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/department/members", response_model=list[schemas.UserOut])
def get_department_members(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users in the current user's department"""
    members = crud.get_department_members(db, current_user.department)
    return members

@router.get("/department/stats", response_model=dict)
def get_department_stats_endpoint(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for the current user's department"""
    stats = crud.get_department_stats(db, current_user.department)
    return stats

@router.get("/department/activity", response_model=list)
def get_department_activity_endpoint(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity from the current user's department"""
    activity = crud.get_department_activity(db, current_user.department)
    return activity

# ----------------  ADMIN DASHBOARD ROUTES ----------------

@router.get("/admin/top-contributors", response_model=list)
def get_top_contributors_endpoint(
    current_user: models.User = Depends(get_current_user),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top contributors - available to all authenticated users"""
    # Allow all authenticated users to view statistics
    return crud.get_top_contributors(db, limit)


@router.get("/admin/most-tagged", response_model=list)
def get_most_tagged_endpoint(
    current_user: models.User = Depends(get_current_user),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get most tagged users - available to all authenticated users"""
    # Allow all authenticated users to view statistics
    return crud.get_most_tagged_users(db, limit)


@router.get("/admin/report-stats", response_model=dict)
def get_report_stats_endpoint(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get report statistics - available to all authenticated users"""
    # Allow all authenticated users to view statistics
    return crud.get_report_stats(db)
