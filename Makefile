# Makefile

.PHONY: build up down migrate shell test

# Build images
build:
    docker-compose --env-file .env -f docker/docker-compose.yml build

# Bring up dev stack
up: build
    docker-compose --env-file .env -f docker/docker-compose.yml up

# Tear down services
down:
    docker-compose -f docker/docker-compose.yml down

# Run DB migrations (Alembic or Django migrate)
migrate:
    docker-compose --env-file .env -f docker/docker-compose.yml run --rm web alembic upgrade head
    # or: python manage.py migrate

# Drop you into a shell inside the web container
shell:
    docker-compose --env-file .env -f docker/docker-compose.yml run --rm web bash

# Run your test suite inside Docker
test:
    docker-compose --env-file .env -f docker/docker-compose.yml run --rm web pytest

