# Facebook AI Connector Messenger CRM (Base Project Scaffold Scaffold)

This is the initial scaffold aligned to **Base Project Scaffold Plan** and the **Roadmap**:
- Monorepo: `extension/` (Chrome MV3) and `backend/` (FastAPI).
- CI via Gitea Actions for both apps.
- Dev environment with Docker Compose (Postgres + backend).
- Minimal end‑to‑end: popup button calls `GET /api/contacts` and displays a toast.

> Onboarding target: < 30 minutes.

## Quick Start

### Prereqs
- Python 3.11+
- Node 18+ (only if you plan to add build tooling to the extension)
- Docker + Docker Compose

### 1) Start database and backend
```bash
docker compose -f infra/docker/compose.dev.yml up --build
# API available at http://localhost:8000
```

### 2) Load the extension (MV3)
1. Go to `chrome://extensions` → Enable **Developer mode**.
2. Click **Load unpacked** → select the `extension/` folder.
3. Click the toolbar icon → **Test API** button should show response or error.

### 3) Test the API manually
```bash
curl http://localhost:8000/healthz
curl http://localhost:8000/api/contacts
```

## Structure
```
extension/      # Chrome extension (MV3) - Popup + Background
backend/        # FastAPI app with /api/contacts & /api/logs
infra/          # Docker Compose for local dev (Postgres + Backend)
.gitea/         # CI workflows for extension and backend
docs/           # Developer docs
```

## Environment
Copy `.env.sample` to service-specific `.env.local` files where needed.

- Backend (example): `backend/.env.local`
```
DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/facrm
ALLOWED_ORIGINS=chrome-extension://*
CONNECTWISE_BASE_URL=https://example.test
CONNECTWISE_KEY=mock-key
CONNECTWISE_SECRET=mock-secret
```

## Next Steps (Base Project Scaffold tasks)
- T7 Replace ConnectWise mock with real sandbox credentials.
- T9 Add Smart Filter UI controls (Companies/Tags/toggles) to popup.
- T11 Do an A11y pass on popup.
- T12 Enhance backend logging to file; add error toasts in popup.
- T13 Flesh out docs/dev-setup.md.

## License
MIT (change as needed).

## Create venv
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

## Makefile

## you can also run this one‑liner from the project root to clean tabs automatically:
sed -E -i '' $'s/^[ ]{2,}/\t/' Makefile
 


## Spins up your Dockerised stack (web + db + volumes).
make up PORT=8010

## The web container will run Django inside Docker and be accessible on host port 8010.

## You use this to work in the exact same environment your team and production use — containers, env files, everything consistent.

##  run migrations, tests, shell, etc. inside the running container with make migrate, make test, etc.


## Bypasses Docker entirely, runs Django directly in your local venv.
make run PORT=8010

## Still uses the same code, but skips all the container orchestration.

## for quick local dev or debugging without container overhead.

## Needs your local .env + dependencies installed in venv.


## Makefile commands

make up [PORT=8000]      # Checks Docker + .env, then builds/starts containers on given port
make down                # Stops containers and removes volumes
make migrate             # Runs Django migrations inside the 'web' container
make test                # Runs pytest inside the 'web' container
make setup               # Creates local venv and installs Python dependencies
make run [PORT=8000]     # Runs Django locally (bypassing Docker) on given port
make shell               # Opens Django shell locally (bypassing Docker)
make check               # Runs Django system checks locally
make logs                # Shows and follows logs from all running containers


## workflow from here

make up PORT=8010        # start stack and follow logs
# in another tab:
make migrate PORT=8010   # run DB migrations
make test PORT=8010      # run pytest
make down                # stop and remove containers

## How to run migrate and test together successfully
PORT=8010 docker compose -f docker/docker-compose.yml up -d --build
## then run
make migrate PORT=8010
make test PORT=8010
## Stop when you’re done:
make down


