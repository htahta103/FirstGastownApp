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

```bash
docker compose up --build
```

- API: http://localhost:8080
- Web: http://localhost:5173

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

## Common Commands

```bash
make build
make test
make lint
make dev
```

## Configuration

See `.env.example` for required environment variables. Do not commit real secrets.
