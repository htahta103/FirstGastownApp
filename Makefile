.PHONY: build test lint typecheck dev down prod
.PHONY: deploy-staging deploy-prod

build:
	go build ./...
	cd web && npm ci && npm run build

test:
	go test ./...
	cd web && npm test --if-present

lint:
	@if command -v golangci-lint >/dev/null 2>&1; then golangci-lint run ./...; else go vet ./...; fi
	cd web && npm run lint

typecheck:
	cd web && npm run typecheck

dev:
	docker compose up --build

down:
	docker compose down -v

prod:
	docker compose -f docker-compose.prod.yml up --build

deploy-staging:
	@echo "TODO: implement staging deploy (CI/CD + VPS/registry)"

deploy-prod:
	@echo "TODO: implement prod deploy (CI/CD + VPS/registry)"
