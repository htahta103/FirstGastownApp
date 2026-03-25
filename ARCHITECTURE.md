# TodoFlow — System Architecture

## 1. Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Dashboard │  │ Projects │  │  Tasks   │  │  Views        │  │
│  │  Page    │  │  CRUD    │  │  CRUD    │  │ List/Board/Cal│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │              │              │                │          │
│  ┌────┴──────────────┴──────────────┴────────────────┴───────┐  │
│  │              React Query + Zustand State Layer             │  │
│  │         (optimistic updates, caching, sync)               │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │  X-User-Id header (anon UUID)        │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTPS / JSON
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                         │
│          /api/* → Go backend    /* → SPA static files           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Go API Server                              │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │  Handlers  │  │  Services  │  │   Repos    │               │
│  │ (chi mux)  │──│  (business │──│ (pgx pool) │               │
│  │            │  │   logic)   │  │            │               │
│  └────────────┘  └────────────┘  └─────┬──────┘               │
│                                        │                       │
│  Middleware: CORS, RequestID, Logger,  │                       │
│  UserID extraction, Recovery           │                       │
└────────────────────────────────────────┼───────────────────────┘
                                         │ TCP :5432
                                         ▼
                              ┌──────────────────┐
                              │   PostgreSQL 16   │
                              │                   │
                              │  todoflow DB      │
                              │  (per-user data   │
                              │   scoped by       │
                              │   user_id FK)     │
                              └──────────────────┘
```

## 2. Data Model

See `schema.sql` for the full DDL. Entity summary:

| Entity    | Purpose                                  | Key Fields                                         |
|-----------|------------------------------------------|-----------------------------------------------------|
| users     | Anonymous session identity               | id (UUID), created_at                               |
| projects  | Grouping container for tasks             | id, user_id, name, icon, color                      |
| tasks     | Core work item                           | id, user_id, project_id, title, description, due_date, priority, status, position |
| subtasks  | One-level checklist items under a task   | id, user_id, task_id, title, completed, position    |
| tags      | User-created colored labels              | id, user_id, name, color                            |
| task_tags | Many-to-many join (tasks ↔ tags)         | task_id, tag_id                                     |
| saved_filters | Persisted filter presets              | id, user_id, name, filter_json                      |

### Key Relationships

- `users` 1→N `projects` 1→N `tasks` 1→N `subtasks`
- `users` 1→N `tags`
- `tasks` N↔N `tags` via `task_tags`
- All tables carry `user_id` for row-level data isolation.

### Design Decisions

- **`position` columns** (float64) on tasks and subtasks enable drag-and-drop reordering without rewriting all rows. Rebalance when gap shrinks below threshold.
- **Cascading deletes**: deleting a project cascades to its tasks, which cascade to subtasks and task_tags. This is the simplest UX — the PRD doesn't mention project-to-project task transfer.
- **`status` is authoritative**: subtask completion does not auto-set task status. The user explicitly moves tasks between Todo/In Progress/Done.
- **`description` stored as plain text**: avoids XSS surface. Frontend can render markdown if desired.

## 3. API Surface Overview

See `api-spec.yaml` for full endpoint details. Summary:

| Resource       | Endpoints                                              |
|----------------|--------------------------------------------------------|
| Users          | `POST /api/users` (create anon session)                |
| Projects       | CRUD: `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` |
| Tasks          | CRUD: `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/position` |
| Subtasks       | CRUD: `GET/POST /api/tasks/:taskId/subtasks`, `PUT/DELETE /api/subtasks/:id`, `PATCH /api/subtasks/:id/toggle` |
| Tags           | CRUD: `GET/POST /api/tags`, `PUT/DELETE /api/tags/:id` |
| Task-Tags      | `POST/DELETE /api/tasks/:taskId/tags/:tagId`           |
| Dashboard      | `GET /api/dashboard` (aggregated stats)                |
| Search         | `GET /api/search?q=...`                                |
| Saved Filters  | CRUD: `GET/POST /api/filters`, `PUT/DELETE /api/filters/:id` |

### Auth Model

No authentication. Anonymous identity via `X-User-Id` header (UUID).

- Frontend generates UUID v4 on first visit, stores in `localStorage`.
- Every request includes `X-User-Id`.
- Backend middleware extracts it; all queries are scoped to that user_id.
- `POST /api/users` auto-provisions the user row (idempotent upsert).

### Error Model

All errors return JSON:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { "field": "title", "reason": "required" }
  }
}
```

Standard codes: `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `BAD_REQUEST`.

## 4. Technology Choices

| Layer        | Choice                        | Rationale                                                        |
|--------------|-------------------------------|------------------------------------------------------------------|
| Frontend     | React 18 + TypeScript         | PRD requirement. Mature ecosystem, strong typing.                |
| Styling      | Tailwind CSS                  | PRD requirement. Utility-first, fast iteration, dark mode built-in. |
| Animations   | Framer Motion                 | PRD requirement. Declarative animations, layout transitions.     |
| State        | TanStack Query (React Query)  | Server state caching, optimistic updates, background refetching. |
| Client state | Zustand                       | Lightweight, no boilerplate. Used for UI state (active view, theme, modals). |
| DnD          | @dnd-kit/core                 | Accessible, performant, works with React 18 concurrent features. |
| Calendar     | date-fns + custom grid        | Lightweight. Avoid heavy calendar libs; the view is read-mostly. |
| Router       | React Router v6               | Standard SPA routing.                                            |
| Backend      | Go 1.22 + Chi v5              | PRD requirement. Chi is idiomatic, composable middleware.        |
| DB driver    | pgx v5                        | High-performance, pure Go PostgreSQL driver with connection pooling. |
| Migrations   | golang-migrate                | File-based, integrates with CI. Run on startup in dev.           |
| Database     | PostgreSQL 16                 | PRD requirement. Robust, excellent for relational + JSON.        |
| Proxy        | Nginx                         | Serves SPA static files, reverse-proxies /api to Go.            |
| Containers   | Docker + Docker Compose       | PRD requirement. Reproducible local and production environments. |

## 5. Frontend Architecture

```
src/
├── api/              # API client (fetch wrappers, typed responses)
├── components/
│   ├── ui/           # Reusable primitives (Button, Input, Card, Toast, Skeleton)
│   ├── layout/       # Sidebar, TopBar, PageContainer
│   ├── dashboard/    # DashboardStats, ProgressRing, ActivityFeed, DeadlineList
│   ├── projects/     # ProjectCard, ProjectForm, ProjectList
│   ├── tasks/        # TaskRow, TaskForm, TaskDetail, SubtaskList
│   ├── views/        # ListView, BoardView, CalendarView, ViewSwitcher
│   ├── search/       # SearchModal (Cmd+/), FilterBar, SavedFilterMenu
│   └── quick-add/    # QuickAddModal (Cmd+K)
├── hooks/            # useUser, useTasks, useProjects, useDashboard, useKeyboard
├── stores/           # Zustand stores (uiStore: theme, activeView, sidebar)
├── pages/            # Dashboard, ProjectDetail, TasksPage
├── types/            # Shared TypeScript interfaces
├── lib/              # date helpers, constants, user-id management
└── App.tsx           # Router + providers + global layout
```

### Key Patterns

- **Optimistic updates**: React Query mutations update cache before server confirms. On error, roll back and show toast.
- **View switching**: URL-driven (`/tasks?view=list|board|calendar`). State preserved when toggling.
- **Keyboard shortcuts**: Global listener in `useKeyboard` hook dispatches to Zustand actions (Cmd+K → open quick-add, Cmd+/ → open search).
- **Theme**: CSS variables + Tailwind `dark:` variants. Zustand persists preference to localStorage.

## 6. Backend Architecture

```
cmd/
└── server/
    └── main.go          # Entry point: config, DB connect, router, serve

internal/
├── config/              # Env-based config (DATABASE_URL, PORT, CORS_ORIGIN)
├── middleware/           # CORS, RequestID, Logger, UserID, Recovery
├── handler/             # HTTP handlers (one file per resource)
│   ├── projects.go
│   ├── tasks.go
│   ├── subtasks.go
│   ├── tags.go
│   ├── dashboard.go
│   ├── search.go
│   └── filters.go
├── service/             # Business logic layer
│   ├── project.go
│   ├── task.go
│   ├── subtask.go
│   ├── tag.go
│   ├── dashboard.go
│   └── search.go
├── repo/                # Database access (pgx queries)
│   ├── project.go
│   ├── task.go
│   ├── subtask.go
│   ├── tag.go
│   ├── dashboard.go
│   └── search.go
├── model/               # Domain structs + enums
└── apierr/              # Structured error types + codes

migrations/
├── 001_create_users.up.sql
├── 001_create_users.down.sql
├── 002_create_projects.up.sql
...
```

### Key Patterns

- **Handler → Service → Repo** layering. Handlers parse HTTP, services enforce rules, repos talk to Postgres.
- **pgx connection pool** shared across repos. Context-based cancellation.
- **UserID middleware** extracts `X-User-Id`, validates UUID format, injects into context. All repo queries filter by user_id.
- **Search** uses PostgreSQL `tsvector`/`tsquery` full-text search on task titles and descriptions with `GIN` index.

## 7. Deployment Topology

### Local (Docker Compose)

```yaml
services:
  db:        # postgres:16-alpine, port 5432, volume for data
  api:       # Go binary, port 8080, depends_on db
  frontend:  # Node dev server (Vite), port 5173, proxies /api to api:8080
```

### Production (Single VPS)

```
┌─────────────────────────────────────────┐
│              VPS (e.g. Hetzner)         │
│                                         │
│  ┌─────────┐  ┌──────┐  ┌───────────┐  │
│  │  Nginx  │──│  Go  │──│ PostgreSQL│  │
│  │ :80/443 │  │ :8080│  │  :5432    │  │
│  └─────────┘  └──────┘  └───────────┘  │
│                                         │
│  Nginx serves /static from built SPA    │
│  Nginx proxies /api/* to Go :8080       │
│  Let's Encrypt for TLS via certbot      │
└─────────────────────────────────────────┘
```

- **CI/CD**: GitHub Actions builds Docker images, pushes to registry, SSH-deploys to VPS.
- **Database backups**: pg_dump cron to object storage (daily).
- **Monitoring**: Structured JSON logging from Go. Optional Prometheus metrics endpoint.
