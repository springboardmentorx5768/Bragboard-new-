from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import auth, users, shoutouts, admin

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="BragBoard API")

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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shoutouts.router)
app.include_router(shoutouts.router)
app.include_router(admin.router)
from .routers import reports
app.include_router(reports.router)
