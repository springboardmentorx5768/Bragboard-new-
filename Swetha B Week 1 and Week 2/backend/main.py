from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.shoutouts import router as shoutout_router
from routers import user, shoutout
outer as users_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user.router)
app.include_router(shoutout.router)
app.include_router(shoutout_router)
