# Dev Setup Guide

## 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## 2. Database (local without Docker)
Install Postgres 16, create DB `facrm`, and set `DATABASE_URL` in `backend/.env.local`.
Run Alembic migrations:
```bash
alembic upgrade head
```

## 3. Extension
Load `extension/` as unpacked in Chrome. Click **Test API** to call backend.
