# TodoFlow

Premium todo app.

Repo layout and services: [ARCHITECTURE.md](ARCHITECTURE.md).

- Backend: Go + PostgreSQL
- Frontend: React + TypeScript (Vite)

## Local Development

### Prerequisites

- Docker Desktop (or Docker Engine)
- Node.js + npm (only needed if running `web` outside Docker)

### Run Everything (Docker Compose)

Uses a shared bridge network **`todoflow_dev`**: Postgres 16, Go API on **:8080** with **[air](https://github.com/air-verse/air)** hot reload, and the Vite dev server on **:5173** proxying **`/api`** to **`http://api:8080`** inside the stack.

```bash
docker compose up --build
```

- API: http://localhost:8080
- Web: http://localhost:5173

Copy `.env.example` to `.env` if you want to override ports or database credentials.

### Run Backend Only

```bash
docker compose up --build db api
```

### Run Web Locally (without Docker)

```bash
cd web
npm install
npm run dev
```

The web dev server proxies `/api` to `http://localhost:8080` (see `web/vite.config.ts`).

## Frontend source of truth

The **only** supported frontend is the Vite app under `web/`. CI, Docker, and staging builds deploy `web/dist`.

### Production-style stack (Nginx + API + Postgres)

Split images: API only (`deploy/docker/Dockerfile.api`), Nginx with built SPA + `/api` reverse proxy (`deploy/docker/Dockerfile.nginx`), Postgres 16 with `deploy/postgres/postgresql.conf`. Network: **`todoflow_prod`**.

```bash
docker compose -f docker-compose.prod.yml up --build
# or: make prod
```

- Browser: **http://localhost** (port **80** by default; override with `NGINX_PORT` in `.env`)
- Images are also built in GitHub Actions and **pushed to GHCR** on pushes to `main`:  
  `ghcr.io/<owner>/todoflow-api` and `ghcr.io/<owner>/todoflow-nginx` (owner lowercased).

The root `Dockerfile` remains a **single-container** option (API + embedded static) for simpler hosts.

## Common Commands

```bash
make build
make test
make lint
make dev
make prod
make deploy-staging
```

`make lint` uses **golangci-lint** when installed; otherwise it falls back to `go vet ./...`. CI always runs golangci-lint.

## Configuration

See `.env.example` for required environment variables. Do not commit real secrets.

Backend runtime requires these environment variables in all environments (including Fly):
- `DATABASE_URL`
- `PORT`
- `CORS_ORIGIN`

### Fly runtime verification (`todoflow-api.fly.dev`)

After deploy, verify from your machine:

```bash
# 1) API process is reachable
curl -fsS "https://todoflow-api.fly.dev/healthz"

# 2) CORS preflight allows your frontend origin
curl -i -X OPTIONS "https://todoflow-api.fly.dev/api/projects" \
  -H "Origin: https://todoflow-staging.pages.dev" \
  -H "Access-Control-Request-Method: GET"
```

Expected results:
- `/healthz` returns `200` with `{"status":"ok"}`
- preflight returns `2xx` and includes `access-control-allow-origin: https://todoflow-staging.pages.dev`

### Staging deploy (from your machine)

`make deploy-staging` needs a staging host and public URL. Easiest setup:

```bash
cp deploy/env.staging.example .env.staging
# edit .env.staging
make deploy-staging
```
