






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



## Running everything inside Docker 🐳 RECOMMENDED !!!!
You don’t need a Python virtual environment locally.

You just need Docker installed, because all Python code runs inside the web container — including migrate, test, and runserver.

Your .env just feeds values into the container.



## Running Python tooling locally (outside Docker) if u want but dont do it 

run manage.py 
## commands without docker compose exec

use Django shell directly on their host

run pytest locally without Docker

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt





## Makefile 

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






🖥️  CRM Extension (Browser UI)
     ⇅  API requests/responses
🛠️  Django Backend (in Docker)
     ├── 📡 REST API Endpoints
     └── ⚙️ Background Jobs (Connector automations)
           ⇅
🗄️  PostgreSQL Database (Local Docker or Cloud)


## How it flows:
The Extension UI sends/receives data via Django’s REST API.

The Connector module runs background automation jobs (can be triggered by the UI or backend dashboard).

Both the UI and background jobs use the same PostgreSQL database as the single source of truth.

Database can be local via Docker Compose or cloud‑hosted — swap by updating .env


## Log API Usage Guide

**Setup Summary**
Logs are stored in src/logs/{ENV}.log and rotated daily (7-day retention).

The active environment is determined by APP_ENV (e.g., dev, test, prod).

Log entries follow the format: "[2025-10-18T21:14:59Z] [dev] INFO: ErrorHandlerMiddleware loaded"

## Viewing Logs via API
## IN TERMINAL

curl -s "http://localhost:8000/api/logs/?level=info" | jq .

This sends a request to /api/logs/ asking for INFO-level logs and formats the JSON output using jq.

**Example output:**

{
  "environment": "dev",
  "entries": [
    "[2025-10-18T21:14:59Z] [dev] INFO: Watching for file changes with StatReloader",
    "[2025-10-18T21:14:59Z] [dev] INFO: ErrorHandlerMiddleware loaded"
  ]
}

**What this confirms:**

Logging system is active

API endpoint is correctly filtering logs

Dev server is watching for file changes

Middleware is loading as expected

## Error-Level Logs

## In TERMINAL

curl -s "http://localhost:8000/api/logs/?level=error" | jq .

**Example response:**

{
  "environment": "dev",
  "entries": []
}
 Is basically asking 
 “Show me the last error logs from dev.” The API replied: 
 “I checked logs/dev.log, but there aren’t any error entries right now.”


## If you don’t have jq, you can use Python’s built-in JSON formatter:

curl "http://localhost:8000/api/logs/?level=info" | python -m json.tool
