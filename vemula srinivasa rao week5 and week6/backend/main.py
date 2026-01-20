# main.py - Updated with more debug info
print("🔧 Starting BragBoard backend...")

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import auth
import schemas
from database import engine, get_db
from models import Base, User, Department, Shoutout, ShoutoutRecipient, Reaction, ReactionType
import shutil
from pathlib import Path
from datetime import datetime
from contextlib import asynccontextmanager

print("✅ All imports successful")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
except Exception as e:
    print(f"❌ Error creating tables: {e}")

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
print(f"✅ Uploads directory ready: {UPLOAD_DIR}")

# Startup function to create default departments
def create_default_departments():
    try:
        db = next(get_db())
        
        dept_count = db.query(Department).count()
        if dept_count == 0:
            departments = [
                Department(name="Engineering"),
                Department(name="Sales"),
                Department(name="Marketing"),
                Department(name="HR"),
                Department(name="Finance"),
            ]
            db.add_all(departments)
            db.commit()
            print("✅ Created default departments")
        else:
            print(f"✅ Departments already exist: {dept_count} departments")
    except Exception as e:
        print(f"❌ Error creating departments: {e}")

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting BragBoard API...")
    create_default_departments()
    yield
    # Shutdown
    print("👋 Shutting down BragBoard API...")

# Create FastAPI app with lifespan
app = FastAPI(title="BragBoard API", lifespan=lifespan)
print("✅ FastAPI app created")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("✅ CORS middleware configured")

@app.get("/")
def read_root():
    return {"message": "BragBoard API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Auth endpoints
@app.post("/api/register", response_model=dict)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_password = auth.get_password_hash(user.password)
    
    # Create user
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
    
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/api/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user by email
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create JWT token
    access_token = auth.create_access_token(data={"sub": str(db_user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_current_user_info(
    current_user: User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    # Get department name if exists
    department_name = None
    if current_user.department_id:
        department = db.query(Department).filter(Department.id == current_user.department_id).first()
        if department:
            department_name = department.name
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "department_name": department_name,
        "created_at": current_user.created_at
    }

# User endpoints
@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    users = db.query(User).all()
    result = []
    
    for user in users:
        department_name = None
        if user.department_id:
            department = db.query(Department).filter(Department.id == user.department_id).first()
            if department:
                department_name = department.name
        
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": department_name,
            "created_at": user.created_at
        })
    
    return result

# Department endpoints
@app.get("/api/departments", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments

# ========== SHOUTOUT ENDPOINTS ==========

# Create shoutout
@app.post("/api/shoutouts")
def create_shoutout(
    shoutout: schemas.ShoutoutCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    print(f"Creating shoutout from user {current_user.id}")
    
    # Create the shoutout
    new_shoutout = Shoutout(
        message=shoutout.message,
        sender_id=current_user.id,
        image_url=shoutout.image_url
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)
    
    # Add recipients
    for recipient_id in shoutout.recipient_ids:
        recipient = ShoutoutRecipient(
            shoutout_id=new_shoutout.id,
            user_id=recipient_id
        )
        db.add(recipient)
    
    db.commit()
    
    print(f"Shoutout created with ID: {new_shoutout.id}")
    return {"message": "Shoutout created successfully", "id": new_shoutout.id}

# Get all shoutouts
@app.get("/api/shoutouts", response_model=List[schemas.ShoutoutResponse])
def get_shoutouts(
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    print(f"Fetching shoutouts for user {current_user.id}")
    
    shoutouts = db.query(Shoutout).order_by(Shoutout.created_at.desc()).all()
    result = []
    
    for shoutout in shoutouts:
        # Get sender info
        sender = db.query(User).filter(User.id == shoutout.sender_id).first()
        
        # Get recipients
        recipients_data = []
        recipient_links = db.query(ShoutoutRecipient).filter(
            ShoutoutRecipient.shoutout_id == shoutout.id
        ).all()
        
        for link in recipient_links:
            recipient = db.query(User).filter(User.id == link.user_id).first()
            if recipient:
                recipients_data.append({
                    "id": recipient.id,
                    "username": recipient.username,
                    "department_id": recipient.department_id
                })
        
        # Get reactions
        reactions = db.query(Reaction).filter(Reaction.shoutout_id == shoutout.id).all()
        
        # Count reactions by type
        reaction_counts = {"like": 0, "clap": 0, "star": 0}
        user_reactions = []
        
        for reaction in reactions:
            reaction_type_str = reaction.reaction_type.value
            reaction_counts[reaction_type_str] += 1
            
            user_reactions.append({
                "user_id": reaction.user_id,
                "reaction_type": reaction_type_str
            })
        
        result.append({
            "id": shoutout.id,
            "message": shoutout.message,
            "sender_id": shoutout.sender_id,
            "sender_name": sender.username if sender else "Unknown",
            "image_url": shoutout.image_url,
            "created_at": shoutout.created_at,
            "recipients": recipients_data,
            "reaction_counts": reaction_counts,
            "user_reactions": user_reactions
        })
    
    print(f"Returning {len(result)} shoutouts")
    return result

# ========== REACTION ENDPOINTS ==========

# Add/remove reaction
@app.post("/api/shoutouts/{shoutout_id}/reactions")
def add_reaction(
    shoutout_id: int, 
    reaction: schemas.ReactionCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    print(f"User {current_user.id} reacting to shoutout {shoutout_id}")
    
    # Verify shoutout exists
    shoutout = db.query(Shoutout).filter(Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")
    
    # Validate reaction type
    valid_types = ["like", "clap", "star"]
    if reaction.reaction_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid reaction type")
    
    # Check if user already reacted with this type
    existing_reaction = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id,
        Reaction.user_id == current_user.id,
        Reaction.reaction_type == ReactionType[reaction.reaction_type.upper()]
    ).first()
    
    if existing_reaction:
        # Remove reaction (toggle off)
        db.delete(existing_reaction)
        db.commit()
        print(f"Reaction removed from shoutout {shoutout_id}")
        return {"message": "Reaction removed", "action": "removed"}
    else:
        # Add new reaction
        new_reaction = Reaction(
            shoutout_id=shoutout_id,
            user_id=current_user.id,
            reaction_type=ReactionType[reaction.reaction_type.upper()]
        )
        db.add(new_reaction)
        db.commit()
        print(f"Reaction added to shoutout {shoutout_id}")
        return {"message": "Reaction added", "action": "added"}

# Remove specific reaction
@app.delete("/api/shoutouts/{shoutout_id}/reactions/{reaction_type}")
def remove_reaction(
    shoutout_id: int,
    reaction_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    reaction = db.query(Reaction).filter(
        Reaction.shoutout_id == shoutout_id,
        Reaction.user_id == current_user.id,
        Reaction.reaction_type == ReactionType[reaction_type.upper()]
    ).first()
    
    if not reaction:
        raise HTTPException(status_code=404, detail="Reaction not found")
    
    db.delete(reaction)
    db.commit()
    return {"message": "Reaction removed"}

# ========== IMAGE UPLOAD ENDPOINT ==========

@app.post("/api/upload-image")
async def upload_image(
    file: UploadFile = File(...), 
    current_user: User = Depends(auth.get_current_user)
):
    """Upload an image for shoutouts"""
    try:
        print(f"Uploading image: {file.filename} for user {current_user.id}")
        
        # Validate file type
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'}
        if file.filename:
            file_extension = file.filename.split(".")[-1].lower()
        else:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Create unique filename
        timestamp = int(datetime.now().timestamp())
        unique_filename = f"{current_user.id}_{timestamp}.{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Image saved: {file_path}")
        return {"image_url": f"/uploads/{unique_filename}"}
    
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ========== DEBUG ENDPOINTS ==========

# DEBUG: Create test user endpoint
@app.post("/api/create-test-user")
def create_test_user(db: Session = Depends(get_db)):
    """Create a test user for development"""
    import auth
    
    # Check if test user exists
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if test_user:
        return {"message": "Test user already exists", "user": test_user.email}
    
    # Create test user
    hashed_password = auth.get_password_hash("password123")
    new_user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hashed_password,
        role="admin"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Test user created", "user": new_user.email}

# Serve uploaded files
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

print("✅ All endpoints configured")
print("✅ Ready to start server...")

# Only for development
if __name__ == "__main__":
    import uvicorn
    print("🌐 Starting Uvicorn server on http://0.0.0.0:8000")
    print("📝 Press CTRL+C to stop the server")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)