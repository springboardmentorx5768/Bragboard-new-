from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import auth, users, shoutouts
from .database import engine
from . import models
import os

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads folder for images
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 🎯 ENSURE THESE ARE REGISTERED CORRECTLY
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shoutouts.router)

@app.get("/")
def root():
    return {"message": "Welcome to BragBoard API"}