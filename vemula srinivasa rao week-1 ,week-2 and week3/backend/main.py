from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
from pydantic import BaseModel
import models
import auth
from database import engine, get_db
from jose import jwt, JWTError

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for requests/responses
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    department_id: Optional[int]
    department_name: Optional[str] = None

class ShoutoutCreate(BaseModel):
    message: str
    recipient_ids: List[int]

class ShoutoutResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_email: str
    message: str
    created_at: str
    recipients: List[UserResponse]

# Helper function to get current user from token
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/")
def read_root():
    return {"message": "Welcome to BragBoard API"}

# ============================================
# USER ENDPOINTS
# ============================================

@app.post("/api/register", response_model=dict)
def register(user: auth.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=getattr(user, 'role', 'employee'),
        department_id=getattr(user, 'department_id', None)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Registration successful! You can now log in.",
        "username": new_user.username,
        "email": new_user.email
    }

@app.post("/api/login", response_model=auth.Token)
def login(user: auth.UserLogin, db: Session = Depends(get_db)):
    # Authenticate user
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user.email, "username": db_user.username, "user_id": db_user.id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        department_id=current_user.department_id,
        department_name=current_user.department.name if current_user.department else None
    )

@app.get("/api/users", response_model=List[UserResponse])
def get_all_users(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).all()
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

# ============================================
# DEPARTMENT ENDPOINTS
# ============================================

@app.post("/api/departments", response_model=DepartmentResponse)
def create_department(
    dept: DepartmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    
    existing = db.query(models.Department).filter(models.Department.name == dept.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    
    new_dept = models.Department(name=dept.name, description=dept.description)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    
    return DepartmentResponse(
        id=new_dept.id,
        name=new_dept.name,
        description=new_dept.description
    )

@app.get("/api/departments", response_model=List[DepartmentResponse])
def get_all_departments(db: Session = Depends(get_db)):
    departments = db.query(models.Department).all()
    return [
        DepartmentResponse(id=d.id, name=d.name, description=d.description)
        for d in departments
    ]

# ============================================
# SHOUTOUT ENDPOINTS (WEEK 3)
# ============================================

@app.post("/api/shoutouts", response_model=ShoutoutResponse)
def create_shoutout(
    shoutout: ShoutoutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not shoutout.message or not shoutout.recipient_ids:
        raise HTTPException(status_code=400, detail="Message and recipients are required")
    
    # Verify all recipients exist
    recipients = db.query(models.User).filter(models.User.id.in_(shoutout.recipient_ids)).all()
    if len(recipients) != len(shoutout.recipient_ids):
        raise HTTPException(status_code=400, detail="One or more recipients not found")
    
    # Create shoutout
    new_shoutout = models.Shoutout(
        sender_id=current_user.id,
        message=shoutout.message
    )
    new_shoutout.recipients = recipients
    
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)
    
    return ShoutoutResponse(
        id=new_shoutout.id,
        sender_id=new_shoutout.sender_id,
        sender_name=current_user.username,
        sender_email=current_user.email,
        message=new_shoutout.message,
        created_at=new_shoutout.created_at.isoformat(),
        recipients=[
            UserResponse(
                id=r.id,
                username=r.username,
                email=r.email,
                role=r.role,
                department_id=r.department_id,
                department_name=r.department.name if r.department else None
            )
            for r in recipients
        ]
    )

@app.get("/api/shoutouts", response_model=List[ShoutoutResponse])
def get_all_shoutouts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shoutouts = db.query(models.Shoutout).order_by(models.Shoutout.created_at.desc()).all()
    
    return [
        ShoutoutResponse(
            id=s.id,
            sender_id=s.sender_id,
            sender_name=s.sender.username,
            sender_email=s.sender.email,
            message=s.message,
            created_at=s.created_at.isoformat(),
            recipients=[
                UserResponse(
                    id=r.id,
                    username=r.username,
                    email=r.email,
                    role=r.role,
                    department_id=r.department_id,
                    department_name=r.department.name if r.department else None
                )
                for r in s.recipients
            ]
        )
        for s in shoutouts
    ]

@app.get("/api/shoutouts/user/{user_id}", response_model=List[ShoutoutResponse])
def get_user_received_shoutouts(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    shoutouts = user.received_shoutouts
    
    return [
        ShoutoutResponse(
            id=s.id,
            sender_id=s.sender_id,
            sender_name=s.sender.username,
            sender_email=s.sender.email,
            message=s.message,
            created_at=s.created_at.isoformat(),
            recipients=[
                UserResponse(
                    id=r.id,
                    username=r.username,
                    email=r.email,
                    role=r.role,
                    department_id=r.department_id,
                    department_name=r.department.name if r.department else None
                )
                for r in s.recipients
            ]
        )
        for s in shoutouts
    ]

@app.get("/api/shoutouts/sent/{user_id}", response_model=List[ShoutoutResponse])
def get_user_sent_shoutouts(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    shoutouts = user.sent_shoutouts
    
    return [
        ShoutoutResponse(
            id=s.id,
            sender_id=s.sender_id,
            sender_name=s.sender.username,
            sender_email=s.sender.email,
            message=s.message,
            created_at=s.created_at.isoformat(),
            recipients=[
                UserResponse(
                    id=r.id,
                    username=r.username,
                    email=r.email,
                    role=r.role,
                    department_id=r.department_id,
                    department_name=r.department.name if r.department else None
                )
                for r in s.recipients
            ]
        )
        for s in shoutouts
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)