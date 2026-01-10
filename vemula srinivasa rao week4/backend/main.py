from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
import os
import shutil
from pathlib import Path

# Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
UPLOAD_DIR = "uploads"

# Create uploads directory
Path(UPLOAD_DIR).mkdir(exist_ok=True)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./bragboard.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Association table for many-to-many relationship
shoutout_recipients = Table(
    'shoutout_recipients',
    Base.metadata,
    Column('shoutout_id', Integer, ForeignKey('shoutouts.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

# Models
class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    users = relationship("User", back_populates="department")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="users")
    sent_shoutouts = relationship("Shoutout", foreign_keys="Shoutout.sender_id", back_populates="sender")
    received_shoutouts = relationship("Shoutout", secondary=shoutout_recipients, back_populates="recipients")

class Shoutout(Base):
    __tablename__ = "shoutouts"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    sender_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_shoutouts")
    recipients = relationship("User", secondary=shoutout_recipients, back_populates="received_shoutouts")

Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "employee"
    department_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department_id: Optional[int]
    department_name: Optional[str]

    class Config:
        from_attributes = True

class ShoutoutCreate(BaseModel):
    message: str
    recipient_ids: List[int]
    image_url: Optional[str] = None

class RecipientInfo(BaseModel):
    id: int
    username: str
    email: str
    department_id: Optional[int]

class ShoutoutResponse(BaseModel):
    id: int
    message: str
    sender_id: int
    sender_name: str
    image_url: Optional[str]
    created_at: datetime
    recipients: List[RecipientInfo]

    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# FastAPI app
app = FastAPI(title="BragBoard API")

# ===== CRITICAL: CORS MUST BE ADDED BEFORE ANY ROUTES =====
# This MUST be one of the first things after creating the app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Initialize default departments
def init_departments(db: Session):
    default_depts = ["Engineering", "Marketing", "Sales", "HR", "Finance"]
    for dept_name in default_depts:
        existing = db.query(Department).filter(Department.name == dept_name).first()
        if not existing:
            db.add(Department(name=dept_name))
    db.commit()

# Initialize on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        init_departments(db)
        print("✅ Database initialized successfully")
        print("🚀 BragBoard API is running on http://localhost:8000")
        print("📚 API docs available at http://localhost:8000/docs")
        print("🔓 CORS enabled for http://localhost:3000")
    finally:
        db.close()

# Mount static files AFTER CORS middleware
try:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
except Exception as e:
    print(f"Warning: Could not mount uploads directory: {e}")

# Routes
@app.get("/")
def root():
    return {"message": "BragBoard API is running!", "status": "ok", "cors": "enabled"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "cors": "enabled"}

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        department_id=user.department_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User registered successfully"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        department_id=current_user.department_id,
        department_name=current_user.department.name if current_user.department else None
    )

@app.get("/api/users", response_model=List[UserResponse])
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            department_id=u.department_id,
            department_name=u.department.name if u.department else None
        )
        for u in users
    ]

@app.get("/api/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"image_url": f"/uploads/{filename}"}

@app.post("/api/shoutouts", response_model=ShoutoutResponse)
def create_shoutout(
    shoutout: ShoutoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recipients = db.query(User).filter(User.id.in_(shoutout.recipient_ids)).all()
    if len(recipients) != len(shoutout.recipient_ids):
        raise HTTPException(status_code=400, detail="Some recipients not found")
    
    db_shoutout = Shoutout(
        message=shoutout.message,
        sender_id=current_user.id,
        image_url=shoutout.image_url,
        recipients=recipients
    )
    db.add(db_shoutout)
    db.commit()
    db.refresh(db_shoutout)
    
    return ShoutoutResponse(
        id=db_shoutout.id,
        message=db_shoutout.message,
        sender_id=db_shoutout.sender_id,
        sender_name=current_user.username,
        image_url=db_shoutout.image_url,
        created_at=db_shoutout.created_at,
        recipients=[
            RecipientInfo(
                id=r.id,
                username=r.username,
                email=r.email,
                department_id=r.department_id
            )
            for r in db_shoutout.recipients
        ]
    )

@app.get("/api/shoutouts", response_model=List[ShoutoutResponse])
def get_shoutouts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    shoutouts = db.query(Shoutout).order_by(Shoutout.created_at.desc()).all()
    return [
        ShoutoutResponse(
            id=s.id,
            message=s.message,
            sender_id=s.sender_id,
            sender_name=s.sender.username,
            image_url=s.image_url,
            created_at=s.created_at,
            recipients=[
                RecipientInfo(
                    id=r.id,
                    username=r.username,
                    email=r.email,
                    department_id=r.department_id
                )
                for r in s.recipients
            ]
        )
        for s in shoutouts
    ]

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Starting BragBoard API Server")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")