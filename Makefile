

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


