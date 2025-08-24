# AgentFlow Development Commands

.PHONY: help dev build test clean deploy

help: ## Show this help message
	@echo "AgentFlow Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker-compose up -d
	@echo "AgentFlow development environment started!"
	@echo "Web UI: http://localhost:3000"
	@echo "Coordinator: http://localhost:8080"
	@echo "IPFS Gateway: http://localhost:8080"

dev-logs: ## Follow development logs
	docker-compose logs -f

build: ## Build all Docker images
	docker-compose build

test: ## Run tests
	npm run test

clean: ## Clean up Docker containers and volumes
	docker-compose down -v
	docker system prune -f

deploy-prod: ## Deploy to production
	docker-compose -f docker-compose.prod.yml up -d

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

xnode-scale: ## Scale xNode workers (usage: make xnode-scale REPLICAS=5)
	docker-compose up -d --scale xnode=$(REPLICAS)

backup-db: ## Backup database
	docker-compose exec postgres pg_dump -U agentflow agentflow > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database (usage: make restore-db FILE=backup.sql)
	docker-compose exec -T postgres psql -U agentflow agentflow < $(FILE)

monitor: ## Show resource usage
	docker stats

health: ## Check service health
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Web service unhealthy"
	@curl -f http://localhost:8080/health || echo "Coordinator unhealthy"
	@docker-compose ps
