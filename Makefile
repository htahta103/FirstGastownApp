.PHONY: build test lint typecheck dev down
.PHONY: deploy-staging deploy-prod

build:
	go build ./...
	cd web && npm ci && npm run build

test:
	go test ./...
	cd web && npm test --if-present

lint:
	# Go: minimal lint (keeps CI light); expand later with golangci-lint if desired.
	go vet ./...
	cd web && npm run lint

typecheck:
	cd web && npm run typecheck

dev:
	docker compose up --build

down:
	docker compose down -v

deploy-staging:
	@echo "TODO: implement staging deploy (CI/CD + VPS/registry)"

deploy-prod:
	@echo "TODO: implement prod deploy (CI/CD + VPS/registry)"
