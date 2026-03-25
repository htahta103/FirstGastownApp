# TodoFlow — Premium Todo App

## Vision
A beautiful, modern todo application with a premium feel. Think Linear meets Things 3 — fast, polished, delightful to use. No authentication — just open and start using.

## Core Features

### 1. Task Management
- Create, edit, delete tasks
- Title + optional description (rich text)
- Due dates with calendar picker
- Priority levels: Urgent, High, Medium, Low (color-coded)
- Tags/labels (user-created, colored)
- Subtasks (one level deep, checkable)

### 2. Organization
- Projects: group tasks into projects with icons + colors
- Smart lists: Today, Upcoming (7 days), Overdue, Completed
- Drag-and-drop reordering within lists
- Quick-add: keyboard shortcut (Cmd+K) opens task creation anywhere

### 3. Views
- List view (default): compact rows, inline editing
- Board view: Kanban columns by status (Todo → In Progress → Done)
- Calendar view: tasks on a monthly/weekly calendar

### 4. Dashboard
- Premium landing dashboard showing:
  - Task stats: total, completed today, overdue count
  - Progress ring / chart for active project
  - Recent activity feed
  - Upcoming deadlines (next 7 days)
  - Quick-add task widget

### 5. Premium UI Requirements
- Dark mode by default, light mode toggle
- Smooth animations: task completion (satisfying check animation), list transitions, drag-and-drop
- Glass morphism cards with subtle blur
- Custom fonts: Inter for UI, JetBrains Mono for any code/mono text
- Responsive: desktop-first but fully functional on mobile
- Loading skeletons, not spinners
- Toast notifications for actions (undo support)
- Empty states with illustrations

### 6. Search & Filter
- Global search (Cmd+/) across all tasks
- Filter by: project, priority, tag, due date range, status
- Filters are combinable and saveable

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Go (net/http or Chi router) + PostgreSQL
- **Deployment**: Docker Compose (local), single VPS (production)

## Non-Functional Requirements
- Page load < 1s
- Task creation < 200ms perceived latency (optimistic UI)
- Support 1000+ tasks per user without lag
- Accessible: keyboard navigable, screen reader friendly
- SEO not required (it's an app, not a content site)

## Success Criteria
- User can open the app and immediately see the dashboard
- User can create a project, add tasks with subtasks, and mark them complete
- All three views (list, board, calendar) functional
- Dashboard shows accurate stats and upcoming deadlines
- Dark/light mode works
- Drag-and-drop works on desktop
- Mobile layout is usable
