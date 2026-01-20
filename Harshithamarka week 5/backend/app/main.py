from fastapi import FastAPI, Depends, status, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import shutil
import os
from typing import Optional
from . import models, schemas
from .database import engine, get_db
from .routers import auth, users, shoutouts
from .security import get_current_user

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="BragBoard API")

origins = ["http://localhost:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = "static/shoutout_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/shoutouts/", status_code=status.HTTP_201_CREATED)
async def create_shoutout(
    message: str = Form(...),
    recipient_ids: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    image_path = None
    if image:
        file_path = os.path.join(UPLOAD_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_path = f"/static/shoutout_images/{image.filename}"

    db_shoutout = models.ShoutOut(sender_id=current_user.id, message=message, image_url=image_path)
    db.add(db_shoutout)
    db.commit()
    db.refresh(db_shoutout)

    id_list = [int(id.strip()) for id in recipient_ids.split(",") if id.strip().isdigit()]
    for r_id in id_list:
        db.add(models.ShoutOutRecipient(shoutout_id=db_shoutout.id, recipient_id=r_id))
    db.commit()
    return {"message": "Success"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shoutouts.router)