from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session 
from database import engine, get_db
import models
from routers import auth_router as auth, departments, shoutouts, notifications, admin
import traceback
from datetime import datetime

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI() 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

app.include_router(departments.router)
app.include_router(shoutouts.router)
app.include_router(notifications.router)
app.include_router(admin.router)

@app.get('/api/greet')
async def greet():
    return {"message":"This is BragBoard."}

@app.post("/api/echo")
def echo(data: dict):
    return {"you_sent": data}

@app.get("/")
def read_root():
    return {"message": "Database tables created successfully!"}

# Test the DB connection
@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"status": "Database is connected"}
