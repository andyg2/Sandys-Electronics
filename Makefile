.PHONY: help setup seed empty examples test serve docker-up docker-down docker-logs clean

help:
	@echo "Edge Devices Inventory - Makefile targets"
	@echo
	@echo "  setup           Full first-time setup (config, DB, schema, examples)"
	@echo "  seed            (Re)create schema + load 197 example inventory items"
	@echo "  empty           (Re)create schema with no inventory rows"
	@echo "  examples        Load 39 example projects into existing schema"
	@echo "  test            Run smoke tests against https://inventory.local"
	@echo "  test BASE=URL   Run smoke tests against a custom URL"
	@echo "  serve           Start PHP built-in server at http://localhost:8080"
	@echo "  docker-up       docker compose up -d"
	@echo "  docker-down     docker compose down"
	@echo "  docker-logs     docker compose logs -f"
	@echo "  clean           Remove uploaded item images"

BASE ?= https://inventory.local

setup:
	bash setup.sh

seed:
	cd inventory && php seed.php

empty:
	cd inventory && php seed.php --empty

examples:
	cd inventory && php _insert_generated_projects.php examples/projects.json

test:
	bash tests/smoke.sh $(BASE)

serve:
	php -S localhost:8080 -t inventory/public

docker-up:
	docker compose up -d
	@echo "Wait ~10s for the DB to seed, then visit http://localhost:8080"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	@find inventory/public/uploads -type f ! -name .gitkeep -delete
	@echo "Cleared inventory/public/uploads/"
