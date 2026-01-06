# app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, auth
from ..deps import get_db
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        existing = crud.get_user_by_email(db, user.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        created = crud.create_user(db, user)
        return created
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not crud.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = auth.create_access_token({"sub": user.email})
    # For simplicity, treat refresh token same function or create separate token with longer expiry
    refresh_token = auth.create_access_token({"sub": user.email}, expires_delta=60*24*30)
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}
