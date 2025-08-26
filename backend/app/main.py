# backend/app/main.py

from dotenv import load_dotenv
from pathlib import Path

# 1) Load the repo-root .env first
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=str(env_path))

# 2) Now import settings so BaseSettings picks up the vars
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="FACRM Backend", version="0.1.0")

# CORS for Chrome extension (MV3)
origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# …rest of your routes…
