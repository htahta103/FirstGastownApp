import { AnimatePresence, motion } from "framer-motion";
import type { DragEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApi, getOrCreateUserId } from "./api/client";
import { PageContainer } from "./components/PageContainer";
import { Sidebar } from "./components/Sidebar";
import { TaskDetail } from "./components/TaskDetail";
import { TaskForm } from "./components/TaskForm";
import { TaskRow } from "./components/TaskRow";
import { TopBar } from "./components/TopBar";
import type { NavMode, Project, SmartListFilter, Tag, Task, TaskStatus } from "./types";

const THEME_KEY = "todoflow_theme";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function filterSmart(tasks: Task[], filter: SmartListFilter): Task[] {
  const today = todayISO();
  switch (filter) {
    case "today":
      return tasks.filter((t) => t.status !== "done" && t.due_date === today);
    case "upcoming":
      return tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date >= today);
    case "overdue":
      return tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
    case "completed":
      return tasks.filter((t) => t.status === "done");
    default:
      return tasks;
  }
}

function statusLabel(s: string): string {
  if (s === "todo") return "Todo";
  if (s === "in_progress") return "In progress";
  if (s === "done") return "Done";
  return s;
}

function positionBetween(beforePos: number | null, afterPos: number | null): number {
  if (beforePos == null && afterPos == null) return 1000;
  if (beforePos == null) return (afterPos as number) / 2;
  if (afterPos == null) return beforePos + 1000;
  const mid = (beforePos + afterPos) / 2;
  if (Math.abs((afterPos as number) - beforePos) < 1e-9) return beforePos + 1;
  return mid;
}

export default function App() {
  const userId = useMemo(() => getOrCreateUserId(), []);
  const api = useMemo(() => createApi(userId), [userId]);

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [nav, setNav] = useState<NavMode>({ kind: "smart", filter: "today" });
  const [selected, setSelected] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("Inbox");

  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return true;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light") return false;
    if (stored === "dark") return true;
    return document.documentElement.classList.contains("dark");
  });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const defaultProjectId =
    nav.kind === "project" ? nav.projectId : (projects[0]?.id ?? "");

  const visibleTasks = useMemo(() => {
    if (nav.kind === "project") return rawTasks;
    return filterSmart(rawTasks, nav.filter);
  }, [nav, rawTasks]);

  const refreshProjects = useCallback(async () => {
    const list = await api.listProjects();
    setProjects(list);
    return list;
  }, [api]);

  const refreshTags = useCallback(async () => {
    const list = await api.listTags();
    setTags(list);
  }, [api]);

  const refreshTasks = useCallback(async () => {
    if (nav.kind === "project") {
      const res = await api.listTasks({ project_id: nav.projectId, sort: "position" });
      setRawTasks(res.tasks);
    } else {
      const res = await api.listTasks({ sort: "due_date", limit: "500" });
      setRawTasks(res.tasks);
    }
  }, [api, nav]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.ensureUser();
        if (cancelled) return;
        await refreshProjects();
        if (cancelled) return;
        await refreshTags();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "Failed to start app");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, refreshProjects, refreshTags]);

  useEffect(() => {
    if (!ready) return;
    void refreshTasks();
  }, [nav, ready, refreshTasks]);

  useEffect(() => {
    if (nav.kind !== "project") return;
    if (projects.length === 0) return;
    if (projects.some((p) => p.id === nav.projectId)) return;
    const first = projects[0]?.id;
    if (first) setNav({ kind: "project", projectId: first });
  }, [nav, projects]);

  useEffect(() => {
    if (!selected) return;
    const still = rawTasks.find((t) => t.id === selected.id);
    if (still) setSelected(still);
  }, [rawTasks, selected]);

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearchLoading(true);
      void api
        .searchTasks(searchQuery)
        .then((r) => {
          setSearchResults(r);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 220);
    return () => window.clearTimeout(t);
  }, [api, searchOpen, searchQuery]);

  const tasksForBoard = useCallback(
    (status: TaskStatus) =>
      visibleTasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position),
    [visibleTasks],
  );

  const applyDrop = useCallback(
    async (targetStatus: TaskStatus, insertBeforeId: string | null) => {
      if (!draggedTaskId) return;
      const task = rawTasks.find((t) => t.id === draggedTaskId);
      if (!task) return;
      if (nav.kind === "project" && task.project_id !== nav.projectId) return;

      const others = tasksForBoard(targetStatus)
        .filter((t) => t.id !== draggedTaskId && t.project_id === task.project_id)
        .sort((a, b) => a.position - b.position);

      let insertIndex = others.length;
      if (insertBeforeId) {
        const idx = others.findIndex((t) => t.id === insertBeforeId);
        if (idx >= 0) insertIndex = idx;
      }

      const before = insertIndex > 0 ? others[insertIndex - 1] : null;
      const after = insertIndex < others.length ? others[insertIndex] : null;
      const newPos = positionBetween(
        before ? before.position : null,
        after ? after.position : null,
      );

      const statusChanged = task.status !== targetStatus;
      try {
        await api.updateTaskPosition(task.id, {
          position: newPos,
          ...(statusChanged ? { status: targetStatus } : {}),
        });
        await refreshTasks();
      } catch {
        /* keep UI; errors surface via task detail if needed */
      }
    },
    [api, draggedTaskId, nav, rawTasks, refreshTasks, tasksForBoard],
  );

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    setCreatingProject(true);
    setBootError(null);
    try {
      const p = await api.createProject({
        name,
        color: "#8b5cf6",
        icon: "inbox",
      });
      await refreshProjects();
      setNav({ kind: "project", projectId: p.id });
      setNewProjectName("Inbox");
    } catch (err) {
      setBootError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setCreatingProject(false);
    }
  }

  function handleSidebarNewProject() {
    const name = window.prompt("Project name");
    if (!name || !name.trim()) return;
    void (async () => {
      try {
        const p = await api.createProject({
          name: name.trim(),
          color: "#8b5cf6",
          icon: "inbox",
        });
        await refreshProjects();
        setNav({ kind: "project", projectId: p.id });
      } catch (err) {
        setBootError(err instanceof Error ? err.message : "Could not create project");
      }
    })();
  }

  const listHeading =
    nav.kind === "project"
      ? `Tasks in ${projects.find((p) => p.id === nav.projectId)?.name ?? "project"}`
      : `Smart list · ${nav.filter}`;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-surface">
        <div className="max-w-md text-center">
          {bootError ? (
            <p className="text-red-600 dark:text-red-300">{bootError}</p>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-violet-500/40" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Connecting to TodoFlow…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 bg-zinc-50 px-4 dark:bg-surface">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Welcome to TodoFlow</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Create your first project to start adding tasks.
          </p>
        </div>
        {bootError && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
            {bootError}
          </p>
        )}
        <form
          onSubmit={handleCreateProject}
          className="flex flex-col gap-3 rounded-xl border border-surface-border bg-white/80 p-4 dark:bg-surface-raised/60"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Project name</span>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="rounded-lg border border-surface-border bg-white px-3 py-2 text-zinc-900 outline-none ring-violet-500/40 focus:ring-2 dark:bg-surface dark:text-zinc-100"
            />
          </label>
          <button
            type="submit"
            disabled={creatingProject}
            className="rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {creatingProject ? "Creating…" : "Create project"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-100 to-white dark:from-surface dark:to-zinc-950">
      <Sidebar
        projects={projects}
        nav={nav}
        onSelectProject={(id) => setNav({ kind: "project", projectId: id })}
        onSelectSmart={(filter) => setNav({ kind: "smart", filter })}
        onNewProject={handleSidebarNewProject}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          viewMode={viewMode}
          onViewMode={setViewMode}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onSearchOpen={() => setSearchOpen(true)}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />

        <PageContainer>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-500"
            >
              {showCreateForm ? "Close form" : "New task"}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="flex min-w-0 flex-col gap-4">
              {showCreateForm && defaultProjectId && (
                <TaskForm
                  api={api}
                  projects={projects}
                  tags={tags}
                  mode="create"
                  defaultProjectId={defaultProjectId}
                  onSaved={async (t) => {
                    await refreshTasks();
                    setSelected(t);
                    setShowCreateForm(false);
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}

              <div className="space-y-2">
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{listHeading}</h2>

                {viewMode === "list" ? (
                  visibleTasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-surface-border bg-white/50 px-4 py-8 text-center text-sm text-zinc-500 dark:bg-surface-raised/30">
                      {nav.kind === "smart"
                        ? "No tasks match this smart list."
                        : "No tasks yet. Create one with “New task”."}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {visibleTasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          selected={selected?.id === t.id}
                          onSelect={(task) => setSelected(task)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Board">
                    {(["todo", "in_progress", "done"] as const).map((status) => (
                      <section
                        key={status}
                        className="flex min-h-[280px] flex-col rounded-xl border border-surface-border bg-white/50 p-3 dark:bg-surface-raised/30"
                      >
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          {statusLabel(status)}
                        </h3>
                        <div
                          className="flex min-h-[120px] flex-1 flex-col gap-2"
                          data-drop-zone={status}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if ((e.target as HTMLElement).closest?.(".cursor-grab")) return;
                            void applyDrop(status, null);
                          }}
                        >
                          {tasksForBoard(status).map((t) => (
                            <div
                              key={t.id}
                              draggable
                              className="cursor-grab rounded-lg border border-surface-border bg-zinc-50/90 px-3 py-2 text-sm font-medium text-zinc-900 active:cursor-grabbing dark:bg-black/40 dark:text-zinc-100"
                              data-task-id={t.id}
                              onDragStart={(e: DragEvent) => {
                                setDraggedTaskId(t.id);
                                e.dataTransfer.setData("text/plain", t.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => setDraggedTaskId(null)}
                              onDragOver={(e: DragEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "move";
                              }}
                              onDrop={(e: DragEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const card = e.currentTarget as HTMLElement;
                                const zone = card.parentElement;
                                if (!zone?.dataset.dropZone) return;
                                const targetStatus = zone.dataset.dropZone as TaskStatus;
                                const rect = card.getBoundingClientRect();
                                const before = e.clientY < rect.top + rect.height / 2;
                                let insertBeforeId: string | null = before
                                  ? (card.dataset.taskId ?? null)
                                  : null;
                                if (!before) {
                                  const next = card.nextElementSibling;
                                  insertBeforeId =
                                    next instanceof HTMLElement ? (next.dataset.taskId ?? null) : null;
                                }
                                void applyDrop(targetStatus, insertBeforeId);
                              }}
                            >
                              {t.title}
                              <div className="mt-1 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500">
                                {t.priority}
                              </div>
                            </div>
                          ))}
                          {tasksForBoard(status).length === 0 && (
                            <p className="rounded-lg border border-dashed border-surface-border p-4 text-center text-sm text-zinc-500">
                              Drop tasks here
                            </p>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <TaskDetail
              api={api}
              task={selected}
              projects={projects}
              tags={tags}
              onTaskUpdated={async (t) => {
                setSelected(t);
                await refreshTasks();
              }}
              onTaskDeleted={async () => {
                setSelected(null);
                await refreshTasks();
              }}
              onClose={() => setSelected(null)}
            />
          </div>
        </PageContainer>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="Search tasks"
              className="w-full max-w-lg rounded-2xl border border-surface-border bg-white p-4 shadow-xl dark:bg-surface-raised"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Search</h2>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                  onClick={() => setSearchOpen(false)}
                >
                  Close
                </button>
              </div>
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks…"
                className="mb-4 w-full rounded-xl border border-surface-border bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 dark:bg-black/40 dark:text-zinc-100"
              />
              {searchLoading && <p className="text-sm text-zinc-500">Searching…</p>}
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {searchResults.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-surface-border px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-white/5"
                      onClick={() => {
                        setSelected(t);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</span>
                      <span className="ml-2 text-xs text-zinc-500">{statusLabel(t.status)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                <p className="text-sm text-zinc-500">No results.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
