# backend/app/routers/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from .. import schemas, models
from ..database import get_db
from ..deps import get_current_user

# --- Face Detection Setup ---
import os

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None
    print("WARNING: 'ultralytics' library not found. Face detection will be DISABLED.")

# Path to the model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "face_model", "final_face_model.pt")
# Ensure absolute path
MODEL_PATH = os.path.abspath(MODEL_PATH)

print(f"Loading Face Detection Model from: {MODEL_PATH}")
face_model = None

if YOLO and os.path.exists(MODEL_PATH):
    try:
        # Load model ensuring we handle potential issues gracefully
        # NOTE: Allow unsafe_globals might be needed if trusting this model, 
        # normally ultralytics handles it.
        face_model = YOLO(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        face_model = None
else:
    if not YOLO:
        print("Model check skipped: ultralytics not installed.")
    else:
        print("Model file not found.")


router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.department is not None:
        current_user.department = user_update.department
    if user_update.role is not None:
        current_user.role = user_update.role
    
    db.commit()
    db.refresh(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

import shutil
import os
import uuid
from fastapi import File, UploadFile, HTTPException

UPLOAD_DIR = "uploads/profile_pics"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/me/picture", response_model=schemas.UserOut)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Access current_user.id inside the function scope where it is available
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Generate unique filename
    # Save file temporarily for face detection
    # We used to save directly to final path. Now we save to a temp path first.
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
    
    # Ensure local directory exists for temp processing
    # Even if using Cloudinary, we need a physical file for the YOLO model (unless we rewrite it to use streams/bytes, but that's risky)
    temp_dir = UPLOAD_DIR # "uploads/profile_pics"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, filename)

    # Save file locally first
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # --- Face Detection Policy Enforcement ---
    if face_model:
        try:
            # Run inference
            print(f"Running face detection on: {file_path}")
            # YOLO expects a file path
            results = face_model.predict(file_path, conf=0.5, verbose=False)
            
            # Count faces
            face_count = 0
            for r in results:
                face_count += len(r.boxes)
            
            print(f"Face count detected: {face_count}")

            if face_count != 1:
                # Validation failed - Delete file and reject
                try:
                    os.remove(file_path)
                except OSError:
                    pass 
                
                msg = "one single face" if face_count == 0 else "only one face"
                detail_msg = f"Profile picture rejected. Detected {face_count} faces. Please add an image with a single face."
                raise HTTPException(status_code=400, detail=detail_msg)
                
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"Face detection unexpected error: {e}")
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except:
                pass
            raise HTTPException(status_code=500, detail="Internal error during image validation.")

    # Validation passed. Now handle final storage.
    # If storage is local, file_path is already in place (uploads/profile_pics/...), we just need the relative URL.
    # If storage is Cloudinary, we upload it then delete the local file.
    
    from ..utils import storage
    
    try:
        final_url = storage.upload_local_file(file_path, folder="profile_pics")
        
        # If Cloudinary, we should delete the local file now (since it was just temp)
        # Check if we are using cloudinary by checking the URL or storage type
        if "http" in final_url and storage.get_storage_type() == "cloudinary":
            os.remove(file_path)
            
    except Exception as e:
        # If upload fails, clean up local file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Image storage failed: {str(e)}")

    # Update user profile
    current_user.profile_picture = final_url
    
    db.commit()
    db.refresh(current_user)
    return current_user

    db.refresh(current_user)
    return current_user


@router.get("/departments", response_model=list[str])
def get_departments(db: Session = Depends(get_db)):
    """Fetch all distinct departments from users."""
    results = db.query(models.User.department).distinct().filter(models.User.department != None).all()
    # results is a list of tuples like [('Engineering',), ('Sales',)]
    return [r[0] for r in results if r[0]]  # Filter out empty strings if any


@router.get("/", response_model=list[schemas.UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # By default, only return active users for things like tagging
    users = db.query(models.User).filter(models.User.is_deleted == "false").offset(skip).limit(limit).all()
    return users

@router.get("/me/notifications", response_model=list[schemas.NotificationOut])
def read_my_notifications(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifications = db.query(models.Notification).options(
        joinedload(models.Notification.sender)
    ).filter(
        models.Notification.recipient_id == current_user.id
    ).order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return notifications

@router.post("/me/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if notification:
        notification.is_read = "true"
        db.commit()
        return {"status": "success"}
    return {"status": "not_found"}

@router.delete("/me/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == current_user.id
    ).first()
    
    if notification:
        db.delete(notification)
        db.commit()
        return {"status": "success", "message": "Notification deleted"}
    
    return {"status": "not_found", "message": "Notification not found"}
