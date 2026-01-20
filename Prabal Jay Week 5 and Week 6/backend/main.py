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
    if user_update.name: current_user.name = user_update.name
    if user_update.department: current_user.department = user_update.department
    db.commit(); db.refresh(current_user)
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
    final_url = media_url
    if file:
        ext = file.filename.split(".")[-1]
        fname = f"{uuid.uuid4()}.{ext}"
        path = f"static/uploads/{fname}"
        with open(path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        final_url = f"http://127.0.0.1:8000/{path}"

    post = models.Shoutout(sender_id=u.id, message=message, image_url=final_url)
    db.add(post); db.commit(); db.refresh(post)
    for rid in recipient_ids.split(","):
        if rid: db.add(models.ShoutoutRecipient(shoutout_id=post.id, recipient_id=int(rid)))
    db.commit(); db.refresh(post)
    return post

@app.get("/shoutouts", response_model=List[schemas.ShoutoutResponse])
def get_feed(department: Optional[str] = None, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    query = db.query(models.Shoutout)
    if department and department != "All":
        query = query.join(models.User, models.Shoutout.sender_id == models.User.id).filter(models.User.department == department)
    return query.order_by(models.Shoutout.created_at.desc()).all()

@app.delete("/shoutouts/{id}")
def delete_shoutout(id: int, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    post = db.query(models.Shoutout).filter(models.Shoutout.id == id).first()
    if post and post.sender_id == u.id:
        db.delete(post); db.commit()
    return {"status": "ok"}

@app.get("/notifications", response_model=List[schemas.ShoutoutResponse])
def get_notifs(db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    links = db.query(models.ShoutoutRecipient).filter(models.ShoutoutRecipient.recipient_id == u.id, models.ShoutoutRecipient.is_seen == False).all()
    ids = [l.shoutout_id for l in links]
    return db.query(models.Shoutout).filter(models.Shoutout.id.in_(ids)).all()

@app.put("/shoutouts/{id}/seen")
def mark_seen(id: int, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    link = db.query(models.ShoutoutRecipient).filter(models.ShoutoutRecipient.shoutout_id == id, models.ShoutoutRecipient.recipient_id == u.id).first()
    if link: link.is_seen = True; db.commit()
    return {"status": "ok"}


@app.post("/shoutouts/{id}/react")
def react_shoutout(id: int, reaction: schemas.ReactionCreate, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    existing = db.query(models.Reaction).filter(models.Reaction.shoutout_id == id, models.Reaction.user_id == u.id).first()
    if existing:
        if existing.type == reaction.type:
            db.delete(existing)
        else:
            existing.type = reaction.type
    else:
        new_reaction = models.Reaction(shoutout_id=id, user_id=u.id, type=reaction.type)
        db.add(new_reaction)
    db.commit()
    return {"status": "ok"}


@app.post("/shoutouts/{id}/comments", response_model=schemas.CommentResponse)
def add_comment(id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), u: models.User = Depends(get_current_user)):
    new_comment = models.Comment(shoutout_id=id, user_id=u.id, content=comment.content)
    db.add(new_comment); db.commit(); db.refresh(new_comment)
    return new_comment