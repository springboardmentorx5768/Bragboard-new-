import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers.auth_router import router as auth_router
from .routers.users_router import router as users_router
from .routers.brag_router import router as brag_router


# ---------------- APP SETUP ----------------

# Create database tables
Base.metadata.create_all(bind=engine)


# Ensure uploads directory exists (use backend/uploads so stored files are served)
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(uploads_dir, exist_ok=True)

app = FastAPI(title="BragBoard API")


# ---------------- STATIC FILES ----------------

# Mount the uploads directory inside the backend package so attachments saved to
# backend/uploads are available at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# ---------------- CORS CONFIG ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- ROUTERS ----------------

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(brag_router)
