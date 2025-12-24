from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import auth, users, shoutouts

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

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shoutouts.router)
