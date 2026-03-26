import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = { DB: D1Database; CORS_ORIGIN: string };
const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("/api/*", async (c, next) => {
  const handler = cors({
    origin: c.env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-User-Id"],
    exposeHeaders: ["X-Request-Id"],
  });
  return handler(c, next);
});

// Helper: get user ID from header
const getUserId = (c: any): string | null =>
  c.req.header("X-User-Id") || null;

const uid = () => crypto.randomUUID().replace(/-/g, "");
const now = () => new Date().toISOString();

// Health
app.get("/healthz", (c) => c.json({ status: "ok" }));

// --- Users ---
app.post("/api/users", async (c) => {
  const id = uid();
  await c.env.DB.prepare("INSERT INTO users (id, created_at) VALUES (?, ?)")
    .bind(id, now())
    .run();
  return c.json({ id, created_at: now() }, 201);
});

// --- Projects ---
app.get("/api/projects", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all();
  return c.json(results);
});

app.post("/api/projects", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const id = uid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO projects (id, user_id, name, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, body.name, body.icon || "folder", body.color || "#3B82F6", ts, ts)
    .run();
  return c.json({ id, user_id: userId, name: body.name, icon: body.icon || "folder", color: body.color || "#3B82F6", created_at: ts, updated_at: ts }, 201);
});

app.get("/api/projects/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const row = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

app.put("/api/projects/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const ts = now();
  await c.env.DB.prepare(
    "UPDATE projects SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.name, body.icon, body.color, ts, c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/projects/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

// --- Tasks ---
app.get("/api/tasks", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const status = c.req.query("status");
  const priority = c.req.query("priority");
  const projectId = c.req.query("project_id");
  let sql = "SELECT * FROM tasks WHERE user_id = ?";
  const params: any[] = [userId];
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (priority) { sql += " AND priority = ?"; params.push(priority); }
  if (projectId) { sql += " AND project_id = ?"; params.push(projectId); }
  sql += " ORDER BY position ASC, created_at DESC";
  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(results);
});

app.get("/api/tasks/calendar", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND due_date IS NOT NULL ORDER BY due_date ASC"
  )
    .bind(userId)
    .all();
  return c.json(results);
});

app.post("/api/tasks", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const id = uid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO tasks (id, user_id, project_id, title, description, due_date, priority, status, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, body.project_id, body.title, body.description || null, body.due_date || null, body.priority || "medium", body.status || "todo", body.position || 0, ts, ts)
    .run();
  return c.json({ id, user_id: userId, ...body, created_at: ts, updated_at: ts }, 201);
});

app.get("/api/tasks/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const row = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE id = ? AND user_id = ?"
  )
    .bind(c.req.param("id"), userId)
    .first();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

app.put("/api/tasks/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const ts = now();
  await c.env.DB.prepare(
    "UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.title, body.description, body.due_date, body.priority, body.status, body.position ?? 0, ts, c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/tasks/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.patch("/api/tasks/:id/position", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.position, now(), c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

// --- Subtasks ---
app.get("/api/tasks/:taskId/subtasks", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM subtasks WHERE task_id = ? AND user_id = ? ORDER BY position ASC"
  )
    .bind(c.req.param("taskId"), userId)
    .all();
  return c.json(results);
});

app.post("/api/tasks/:taskId/subtasks", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const id = uid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO subtasks (id, user_id, task_id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, c.req.param("taskId"), body.title, body.position || 0, ts, ts)
    .run();
  return c.json({ id, task_id: c.req.param("taskId"), title: body.title, completed: false, position: body.position || 0, created_at: ts, updated_at: ts }, 201);
});

app.put("/api/subtasks/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE subtasks SET title = ?, completed = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.title, body.completed ? 1 : 0, body.position ?? 0, now(), c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/subtasks/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare("DELETE FROM subtasks WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.patch("/api/subtasks/:id/toggle", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare(
    "UPDATE subtasks SET completed = NOT completed, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(now(), c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

// --- Tags ---
app.get("/api/tags", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tags WHERE user_id = ? ORDER BY name ASC"
  )
    .bind(userId)
    .all();
  return c.json(results);
});

app.post("/api/tags", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const id = uid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO tags (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, body.name, body.color || "#6B7280", ts, ts)
    .run();
  return c.json({ id, name: body.name, color: body.color || "#6B7280", created_at: ts, updated_at: ts }, 201);
});

app.put("/api/tags/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE tags SET name = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.name, body.color, now(), c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/tags/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare("DELETE FROM tags WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.post("/api/tasks/:taskId/tags/:tagId", async (c) => {
  await c.env.DB.prepare("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)")
    .bind(c.req.param("taskId"), c.req.param("tagId"))
    .run();
  return c.json({ ok: true });
});

app.delete("/api/tasks/:taskId/tags/:tagId", async (c) => {
  await c.env.DB.prepare("DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?")
    .bind(c.req.param("taskId"), c.req.param("tagId"))
    .run();
  return c.json({ ok: true });
});

// --- Dashboard ---
app.get("/api/dashboard", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const total = await c.env.DB.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?").bind(userId).first();
  const byStatus = await c.env.DB.prepare("SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status").bind(userId).all();
  const byPriority = await c.env.DB.prepare("SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY priority").bind(userId).all();
  const overdue = await c.env.DB.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date < date('now') AND status != 'done'").bind(userId).first();
  return c.json({ total: total?.count || 0, by_status: byStatus.results, by_priority: byPriority.results, overdue: overdue?.count || 0 });
});

// --- Search ---
app.get("/api/search", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const q = c.req.query("q") || "";
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC LIMIT 50"
  )
    .bind(userId, `%${q}%`, `%${q}%`)
    .all();
  return c.json(results);
});

// --- Saved Filters ---
app.get("/api/filters", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all();
  return c.json(results);
});

app.post("/api/filters", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  const id = uid();
  const ts = now();
  await c.env.DB.prepare(
    "INSERT INTO saved_filters (id, user_id, name, filter_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, userId, body.name, JSON.stringify(body.filter_json || {}), ts, ts)
    .run();
  return c.json({ id, name: body.name, filter_json: body.filter_json || {}, created_at: ts, updated_at: ts }, 201);
});

app.put("/api/filters/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  const body = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE saved_filters SET name = ?, filter_json = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(body.name, JSON.stringify(body.filter_json || {}), now(), c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

app.delete("/api/filters/:id", async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "X-User-Id required" }, 401);
  await c.env.DB.prepare("DELETE FROM saved_filters WHERE id = ? AND user_id = ?")
    .bind(c.req.param("id"), userId)
    .run();
  return c.json({ ok: true });
});

export default app;
