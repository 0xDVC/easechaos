.PHONY: run-backend run-frontend install build up down local clean test lint format

DOCKER_COMPOSE_FILE=docker-compose.dev.yml
VOLUMES=easechaos_redis-data

install:
	uv pip install -r requirements.txt
	cd frontend && pnpm install

run-backend:
	uv run uvicorn api.api:app --reload --port 3300

run-frontend:
	cd frontend && pnpm run dev

local:
	make install
	make run-backend &
	make run-frontend

build:
	docker compose -f $(DOCKER_COMPOSE_FILE) build

up:
	docker compose -f $(DOCKER_COMPOSE_FILE) up --build

down:
	docker compose -f $(DOCKER_COMPOSE_FILE) down

clean:
	docker compose -f $(DOCKER_COMPOSE_FILE) down -v
	docker volume rm $(VOLUMES)

test:
	uv run pytest api/test/ -v

lint:
	flake8 .
	black . --check
	isort . --check-only

format:
	black .
	isort .
