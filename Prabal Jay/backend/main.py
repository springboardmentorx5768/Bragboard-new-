from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import models, auth, schemas
from database import engine, get_db
from typing import List, Optional
import shutil, os, uuid

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(token_data: dict = Depends(auth.get_user_from_token), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == token_data["email"]).first()
    if not user: raise HTTPException(401, "User not found")
    return user

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(400, "Email registered")
    new_user = models.User(name=user.name, email=user.email, password=auth.get_password_hash(user.password), department=user.department)
    db.add(new_user); db.commit(); db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": auth.create_access_token(data={"sub": user.email}), "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserProfileResponse)
def get_me(u: models.User = Depends(get_current_user)): return u

@app.put("/users/me", response_model=schemas.UserResponse)
def update_user_me(user_update: schemas.UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.name:
        current_user.name = user_update.name
    if user_update.department:
        current_user.department = user_update.department
    
    db.add(current_user) 
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    return db.query(models.User).all()


@app.post("/shoutouts", response_model=schemas.ShoutoutResponse)
async def create_shoutout(
    message: str = Form(...),
    recipient_ids: str = Form(...), 
    media_url: Optional[str] = Form(None), 
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    u: models.User = Depends(get_current_user)
):
    final_image_url = media_url
    if file:
        ext = file.filename.split(".")[-1]
        fname = f"{uuid.uuid4()}.{ext}"
        path = f"static/uploads/{fname}"
        with open(path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        final_image_url = f"http://127.0.0.1:8000/{path}"

    post = models.Shoutout(sender_id=u.id, message=message, image_url=final_image_url)
    db.add(post); db.commit(); db.refresh(post)

    for rid in recipient_ids.split(","):
        if rid:
            db.add(models.ShoutoutRecipient(shoutout_id=post.id, recipient_id=int(rid)))
    
    db.commit(); db.refresh(post)
    return post

@app.get("/shoutouts", response_model=List[schemas.ShoutoutResponse])
def get_feed(department: Optional[str] = None, sender_id: Optional[int] = None, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    query = db.query(models.Shoutout)
    if department and department != "All":
        query = query.join(models.User, models.Shoutout.sender_id == models.User.id).filter(models.User.department == department)
    if sender_id:
        query = query.filter(models.Shoutout.sender_id == sender_id)
    
    posts = query.order_by(models.Shoutout.created_at.desc()).all()
    return posts

@app.delete("/shoutouts/{id}")
def delete_shoutout(id: int, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    post = db.query(models.Shoutout).filter(models.Shoutout.id == id).first()
    if post and post.sender_id == u.id:
        db.delete(post); db.commit()
    return {"status": "ok"}

@app.get("/notifications", response_model=List[schemas.ShoutoutResponse])
def get_notifications(db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    links = db.query(models.ShoutoutRecipient).filter(
        models.ShoutoutRecipient.recipient_id == u.id,
        models.ShoutoutRecipient.is_seen == False
    ).all()
    shoutout_ids = [link.shoutout_id for link in links]
    return db.query(models.Shoutout).filter(models.Shoutout.id.in_(shoutout_ids)).all()

@app.put("/shoutouts/{id}/seen")
def mark_seen(id: int, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    link = db.query(models.ShoutoutRecipient).filter(
        models.ShoutoutRecipient.shoutout_id == id,
        models.ShoutoutRecipient.recipient_id == u.id
    ).first()
    if link:
        link.is_seen = True
        db.commit()
    return {"status": "ok"}

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return None