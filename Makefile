# --- Config ---
PORT ?= 8000
COMPOSE_FILE = docker/docker-compose.yml
SRC_PATH := $(shell pwd)/src
# Default shell
SHELL := /bin/bash

setup:
	@echo "🚀 Starting full project setup..."
	# 1. Copy env file if it doesn't exist
	@if [ ! -f .env ]; then \
	cp .env.example .env && echo "✅ .env created from .env.example"; \
	else \
	echo "ℹ️  .env already exists, skipping copy"; \
	fi
	# 2. Build and start containers
	cd docker && docker compose up --build -d
	# 3. Apply Django migrations
	cd docker && docker compose exec web python manage.py migrate
	# 4. Create superuser if none exists
	cd docker && docker compose exec web bash -c "echo 'from django.contrib.auth import get_user_model; \
	User = get_user_model(); \
	User.objects.create_superuser(\"admin@example.com\", \"adminpass\") if not User.objects.exists() else print(\"Superuser already exists\")' | python manage.py shell"
	@echo "🎯 Setup complete! Visit http://localhost:8000/admin"


# --- Phony targets ---
.PHONY: up down migrate test setup check-docker check-env run shell check logs

# --- Environment + Docker checks ---
check-docker:
	@docker info > /dev/null 2>&1 || (echo "❌ Docker is not running. Please start Docker Desktop." && exit 1)

check-env:
	@test -f .env || (echo "❌ .env file missing. Run: cp .env.example .env" && exit 1)

# --- Container commands ---
up: check-docker check-env
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) up --build

down:
	docker compose -f $(COMPOSE_FILE) down --volumes

migrate:
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) exec web python manage.py migrate

test:
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) exec web pytest --maxfail=1 --disable-warnings -q

# --- Local dev helpers ---
setup:
	python -m venv venv
	. venv/bin/activate && pip install -r requirements.txt

run:
	PYTHONPATH=./src python manage.py runserver 0.0.0.0:$(PORT)

shell:
	PYTHONPATH=./src python manage.py shell

check:
	export PYTHONPATH=$(SRC_PATH) && python manage.py check

logs:
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) logs -f

restart: down
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) up -d --build
	PORT=$(PORT) docker compose -f $(COMPOSE_FILE) exec web env | grep POSTGRES_PORT


