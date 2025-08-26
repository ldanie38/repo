

.PHONY: up down migrate test

up:
    docker-compose -f docker/docker-compose.yml up --build

down:
    docker-compose -f docker/docker-compose.yml down --volumes

migrate:
    docker-compose -f docker/docker-compose.yml exec web \
      python manage.py migrate

test:
    docker-compose -f docker/docker-compose.yml exec web \
      pytest --maxfail=1 --disable-warnings -q


setup:
    python -m venv venv
    . venv/bin/activate && pip install -r requirements.txt

check-docker:
    @docker info > /dev/null 2>&1 || (echo "❌ Docker is not running. Please start Docker Desktop." && exit 1)

up: check-docker
    docker-compose -f docker/docker-compose.yml up --build


WORKDIR /app

# Copy everything in; your code now lives at /app/src/…
COPY . .

# Tell Python where to look
ENV PYTHONPATH=/app/src

# Default command using manage.py or uvicorn
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

.PHONY: run shell

run:
    PYTHONPATH=./src python manage.py runserver 0.0.0.0:8000

shell:
    PYTHONPATH=./src python manage.py shell

# Makefile

SRC_PATH := $(shell pwd)/src

.PHONY: check
check:
    export PYTHONPATH=$(SRC_PATH) && \
    python manage.py check
