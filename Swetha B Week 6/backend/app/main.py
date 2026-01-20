from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import auth, users, shoutouts, notifications, activity, comments
from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API")

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Allow frontend on Vite dev server
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to BragBoard API"}

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shoutouts.router)
app.include_router(comments.router)
app.include_router(activity.router)
app.include_router(notifications.router)
