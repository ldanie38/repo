## Current State” note up top saying this repo contains both the original FastAPI scaffold and a new Django backend, 
## here’s how to work with each would orient new contributors instantly.



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




## Lua
## Local Development Setup
## This project runs a Django backend in Docker with a Postgres database. Follow these steps to get started.


1. Install prerequisites
Docker Desktop

Python 3.11+ (for running local tooling/scripts)

Git

2. Clone the repo
git clone <your-repo-url>
cd <your-repo-name>

3. Create your .env file
Copy the template and adjust values if needed:
or since we have .env.example u can run this in bash/zsh  ---> cp .env.example .env


PORT=8000

POSTGRES_DB=ctm_db
POSTGRES_USER=ctm_user
POSTGRES_PASSWORD=supersecret
POSTGRES_HOST=db
POSTGRES_PORT=5432

SECRET_KEY=dev_secret_key_here
DEBUG=True


☁️ Cloud / Shared DB
# PORT=8000
# POSTGRES_DB=ctm_db
# POSTGRES_USER=team_user
# POSTGRES_PASSWORD=change_me
# POSTGRES_HOST=your-cloud-db-host.rds.amazonaws.com
# POSTGRES_PORT=5432
# SECRET_KEY=secure_production_key_here
# DEBUG=False
# HOST=0.0.0.0
# RELOAD=False


# App server
HOST=0.0.0.0
RELOAD=True
If using a shared/cloud Postgres instance, replace POSTGRES_HOST and POSTGRES_PORT with the credentials provided by the instance owner.


4. Start the app
Build and start in detached mode
PORT=8000 docker compose -f docker/docker-compose.yml up -d --build


5. Run migrations & tests
make migrate PORT=8000
make test PORT=8000
or
docker compose -f docker/docker-compose.yml exec web python manage.py migrate


6. Access the app
Django runs at: http://localhost:8000
API endpoints follow /api/... as defined in the project.


## Django Backend
## Lua 

## Running everything inside Docker 🐳 RECOMMENDED !!!!
You don’t need a Python virtual environment locally.

You just need Docker installed, because all Python code runs inside the web container — including migrate, test, and runserver.

Your .env just feeds values into the container.


## Lua
## Running Python tooling locally (outside Docker) if u want but dont do it 

run manage.py 
## commands without docker compose exec

use Django shell directly on their host

run pytest locally without Docker

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt




## Lua
## Makefile 

## Spins up your Dockerised stack (web + db + volumes).
make up PORT=8010

## The web container will run Django inside Docker and be accessible on host port 8010.

## You use this to work in the exact same environment your team and production use — containers, env files, everything consistent.

##  run migrations, tests, shell, etc. inside the running container with make migrate, make test, etc.

## Lua
## Bypasses Docker entirely, runs Django directly in your local venv.
make run PORT=8010

## Still uses the same code, but skips all the container orchestration.

## for quick local dev or debugging without container overhead.

## Needs your local .env + dependencies installed in venv.



## Makefile commands
sed -E -i '' $'s/^[ ]{2,}/\t/' Makefile 

make restart             # full restart + verify
make up [PORT=8000]      # Checks Docker + .env, then builds/starts containers on given port
make down                # Stops containers and removes volumes
make migrate             # Runs Django migrations inside the 'web' container
make test                # Runs pytest inside the 'web' container
make setup               # Creates local venv and installs Python dependencies
make run [PORT=8000]     # Runs Django locally (bypassing Docker) on given port
make shell               # Opens Django shell locally (bypassing Docker)
make check               # Runs Django system checks locally
make logs                # Shows and follows logs from all running containers


## WORKFLOW from here

## start or reatrt your stack
PORT=8010 docker compose -f docker/docker-compose.yml up -d --build

## check container status
docker compose -f docker/docker-compose.yml ps

## apply migrations
docker compose -f docker/docker-compose.yml exec web python manage.py migrate

Spins up containers

Waits for DB readiness

Runs migrations in one go


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


## Restart your stack: or --->  make restart
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d --build

## Verify the app picks up the changes:
docker compose -f docker/docker-compose.yml exec web env | grep POSTGRES_PORT

## restart docker containers
PORT=8000 docker compose -f docker/docker-compose.yml up -d



## Database access
From inside db container:
docker compose -f docker/docker-compose.yml exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

## run to open SQL shell
docker compose -f docker/docker-compose.yml exec web python manage.py dbshell
## if u see ctm_db=#  means Django successfully connected to your Postgres database

## Explore what’s in the schema
\dt            -- list all tables in the current schema
\dt *.*         -- list tables in all schemas
\d table_name   -- describe table columns and types
## exit shell
\q or CTRL+D


## Lua 
## Architecture Overview

         ┌────────────────────┐
         │   CRM Extension    │         
         │ (Browser Frontend) │
         └─────────┬──────────┘
                   │  API calls
                   ▼
         ┌────────────────────┐
         │    Django Backend  │
         │ (Docker Container) │
         └──────┬─────┬───────┘
                │     │
      Background│     │REST API
        Jobs    │     │Endpoints
   (Connector   │     │
    Automations)│     │
                ▼     ▼
         ┌────────────────────┐
         │   PostgreSQL DB    │
         │(Local or Cloud via │
         │   Docker Network)  │
         └────────────────────┘



## or 


🖥️  CRM Extension (Browser UI)
     ⇅  API requests/responses
🛠️  Django Backend (in Docker)
     ├── 📡 REST API Endpoints
     └── ⚙️ Background Jobs (Connector automations)
           ⇅
🗄️  PostgreSQL Database (Local Docker or Cloud)


## How it flows:
The CRM Extension UI sends/receives data via Django’s REST API.

The Connector module runs background automation jobs (can be triggered by the UI or backend dashboard).

Both the UI and background jobs use the same PostgreSQL database as the single source of truth.

Database can be local via Docker Compose or cloud‑hosted — swap by updating .env