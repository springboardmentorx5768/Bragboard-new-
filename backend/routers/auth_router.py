from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
print(f"DEBUG: auth module loaded in router is: {auth}")


router = APIRouter(
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate Department if provided
    if user.department_id:
        dept = db.query(models.Department).filter(models.Department.id == user.department_id).first()
        if not dept:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid department ID"
            )

    # Hash the password
    hashed_password = auth.Hash.make(user.password)
    
    # Create new user
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        department_id=user.department_id,
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid Credentials"
        )
    
    if not auth.Hash.verify(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid Credentials"
        )
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if user_update.email and user_update.email != current_user.email:
        # Check if email is already taken
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
        
    if user_update.name:
        current_user.name = user_update.name

    if user_update.department_id is not None:
        # Verify department exists
        dept = db.query(models.Department).filter(models.Department.id == user_update.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid department ID")
        current_user.department_id = user_update.department_id
        
    db.commit()
    db.refresh(current_user)
    return current_user


