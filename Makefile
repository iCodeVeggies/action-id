.PHONY: help build up down logs restart clean db-shell db-backup db-restore

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

restart: ## Restart all services
	docker-compose restart

clean: ## Stop services and remove volumes
	docker-compose down -v

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d actionid

db-backup: ## Backup database
	docker-compose exec postgres pg_dump -U postgres actionid > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore: ## Restore database (usage: make db-restore FILE=backup.sql)
	docker-compose exec -T postgres psql -U postgres actionid < $(FILE)

dev-db: ## Start only database for local development
	docker-compose -f docker-compose.dev.yml up -d postgres

dev-db-down: ## Stop development database
	docker-compose -f docker-compose.dev.yml down
