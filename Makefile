# Makefile at repo root for managing Django + Docker Compose

COMPOSE_FILE=docker/docker-compose.yml
SERVICE=web

# Start containers in detached mode
up:
	docker compose -f $(COMPOSE_FILE) up -d

# Stop and remove containers
down:
	docker compose -f $(COMPOSE_FILE) down

# Build (or rebuild) images
build:
	docker compose -f $(COMPOSE_FILE) build

# Run Django dev server inside the web container
runserver:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) python manage.py runserver 0.0.0.0:8000

# Apply migrations
migrate:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) python manage.py migrate

# Create new migrations
makemigrations:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) python manage.py makemigrations

# Open a Django shell
shell:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE) python manage.py shell

# Tail logs for the web service
logs:
	docker compose -f $(COMPOSE_FILE) logs -f $(SERVICE)

# Restart everything (down + up + runserver)
restart: down up runserver


# Now you can run:

# make build   → rebuilds your images (same as docker compose build).

# make up      → start containers

# make runserver     → run Django dev server inside the web container

# make migrate       / make makemigrations → manage DB

# make restart     → full cycle refresh