# TodoFlow — Architecture Requirements

This document captures the domain model, key user flows, and non-functional requirements derived from `prd.md` so the `Architect` can design the system and fan out implementation work.

## 1. Core Domain Entities & Relationships

### Anonymous user model (no authentication)

The PRD states: "No authentication — just open and start using." To still support multi-user data separation on the backend (NFR mentions 1000+ tasks per user), model a lightweight `User` identity as an anonymous session ID:

- The frontend generates a UUID on first visit and persists it in `localStorage`.
- The frontend sends this UUID on every API request (e.g., `X-User-Id` header).
- The backend uses it to scope all data (projects/tasks/subtasks/tags) per user.

If the chosen approach is different, preserve the invariant: each user's data is isolated without login.

### Entities

1. `Project`
   - `id` (UUID)
   - `user_id` (UUID, anonymous user)
   - `name` (string)
   - `icon` (string; constrained by UI to a chosen set)
   - `color` (string; constrained by UI to a chosen palette)
   - `created_at`, `updated_at`

2. `Task`
   - `id` (UUID)
   - `user_id` (UUID)
   - `project_id` (UUID; required)
   - `title` (string)
   - `description` (optional rich text; store as plain text or sanitized HTML depending on implementation choice)
   - `due_date` (date; nullable)
   - `priority` (enum: `Urgent`, `High`, `Medium`, `Low`)
   - `status` (enum for board/calendar: `Todo`, `In Progress`, `Done`)
   - `created_at`, `updated_at`

3. `Subtask` (one-level deep)
   - `id` (UUID)
   - `user_id` (UUID)
   - `task_id` (UUID)
   - `title` (string)
   - `completed` (boolean) or `completed_at` (nullable timestamp)
   - `created_at`, `updated_at`

4. `Tag` (user-created label)
   - `id` (UUID)
   - `user_id` (UUID)
   - `name` (string)
   - `color` (string; constrained palette)
   - `created_at`, `updated_at`

5. `TaskTag` join table (many-to-many)
   - `task_id` (UUID)
   - `tag_id` (UUID)

### Relationship Summary

- `User` 1..N `Project`
- `Project` 1..N `Task`
- `Task` 1..N `Subtask` (exactly one level deep; subtasks do not nest)
- `User` 1..N `Tag`
- `Task` N..N `Tag` via `TaskTag`

### Derived Behavior Rules

- `status` drives board columns (`Todo`, `In Progress`, `Done`) and calendar display logic.
- Task completion:
  - Treat "Done" as the authoritative status for views.
  - Subtask completion is tracked independently and does not replace status unless the UI chooses to auto-sync (to be confirmed in implementation).

## 2. Key User Flows

1. Open app -> dashboard
   - Load dashboard quickly (<1s target).
   - Show:
     - total tasks
     - completed today
     - overdue count
     - progress ring/chart for active project
     - recent activity feed
     - upcoming deadlines (next 7 days)
     - quick-add entry

2. Projects
   - Create a project with icon + color.
   - Edit project metadata.
   - Delete project with clear handling for orphan tasks (prefer cascading delete or explicit transfer; pick one and document).

3. Task CRUD with rich fields
   - Create/edit/delete tasks.
   - Set title, optional description, due date, priority, tags/labels.
   - Associate task with a project.
   - Update list/board/calendar views instantly.

4. Subtasks
   - Add one-level subtasks to a task.
   - Toggle subtask completion.
   - Ensure task view components remain consistent across views.

5. Views switching
   - List view: compact rows and inline editing.
   - Board view: drag-and-drop between status columns and reorder within a column.
   - Calendar view: monthly/weekly rendering based on due dates.

6. Search & filter
   - Global search across tasks (Cmd+/).
   - Filters: project, priority, tag, due date range, status.
   - Filters are combinable and saved presets can be reused.

7. Quick-add
   - Cmd+K opens task creation from anywhere.
   - Created task appears in current view context (taking active filters into account).

8. Premium UX behaviors
   - Dark mode by default with light-mode toggle.
   - Smooth animations on major transitions (completion, list transitions, drag-and-drop).
   - Loading skeletons (not spinners).
   - Toast notifications with undo support for user actions where feasible.
   - Responsive layout usable on mobile.

## 3. Non-Functional Requirements

- Performance
  - Page load < 1s
  - Task creation perceived latency < 200ms via optimistic UI
  - Support 1000+ tasks per user without lag

- Accessibility
  - Keyboard navigable UI
  - Screen reader friendly (semantic HTML + appropriate ARIA)
  - No console errors in core flows

- Compatibility / UX
  - Drag-and-drop works on desktop
  - Mobile layout is usable

## 4. Preferred Tech Stack

From PRD:

- Frontend: React 18 + TypeScript + Tailwind CSS + Framer Motion
- Backend: Go (`net/http` or `chi` router) + PostgreSQL
- Deployment:
  - Docker Compose for local
  - Single VPS for production

## 5. Implementation Notes / Open Questions

- Authentication: PRD says none. Recommended approach is anonymous session UUID scoping (`X-User-Id`).
- Rich text: choose a safe representation for `description` (plain text vs sanitized HTML).
- Task completion semantics with subtasks:
  - confirm whether completing all subtasks should auto-set task `status = Done` (or keep them independent).
- Deletion semantics:
  - decide whether deleting a project deletes tasks or transfers them to another project.

