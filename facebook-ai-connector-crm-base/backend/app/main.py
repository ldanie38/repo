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

@app.get("/api/contacts")
def get_contacts():
    # Mock contacts for Base Project Scaffold
    return [
        {"id": 1, "name": "Ada Lovelace", "tags": ["prospect", "ai"]},
        {"id": 2, "name": "Alan Turing", "tags": ["ml", "friend"]},
    ]

@app.get("/api/logs")
def get_logs():
    return [{"ts": "2025-08-12T12:00:00Z", "msg": "Mock log entry"}]
