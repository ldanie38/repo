# Path to your environment file
ENV_FILE := .env

# Base docker compose command with your compose file
COMPOSE := docker compose -f docker/docker-compose.yml

.PHONY: dev down config migrate

dev: ## Build and start web + db in detached mode
    $(COMPOSE) --env-file $(ENV_FILE) up -d --build

down: ## Stop services, remove containers, volumes, and orphans
    $(COMPOSE) down --volumes --remove-orphans

config: ## Show the merged Compose YAML
    $(COMPOSE) --env-file $(ENV_FILE) config

migrate: ## Run Django migrations inside the web service
    $(COMPOSE) exec web python manage.py migrate
