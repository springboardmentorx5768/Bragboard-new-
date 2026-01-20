from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm 

from .. import schemas, models
from ..database import get_db
from ..security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password=hash_password(user_in.password),
        department=user_in.department,
        role=user_in.role,
    )
    
    db.add(user)
    try:
        db.flush() 
        db.commit()  
        db.refresh(user)
    except Exception as e:
        db.rollback() 
        print(f"DATABASE FAILED TO COMMIT: {e}")
        raise HTTPException(status_code=500, detail="Database error during registration.")

    return user

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(user_id=user.id, user_name=user.name) 

    return schemas.Token(
        access_token=access_token,
        user_name=user.name,
        department=user.department,
        role=user.role.value 
    )

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2-compatible login (for Swagger UI and OAuth2 clients).
    Accepts form data with 'username' and 'password' fields. username is the email.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(user_id=user.id)
    return schemas.Token(access_token=access_token)
