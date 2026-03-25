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

## Common Commands

```bash
make build
make test
make lint
make dev
```

## Configuration

See `.env.example` for required environment variables. Do not commit real secrets.
