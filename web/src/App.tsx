import { useCallback, useEffect, useMemo, useState } from "react";
import { createApi, getOrCreateUserId } from "./api/client";
import { TaskDetail } from "./components/TaskDetail";
import { TaskForm } from "./components/TaskForm";
import { TaskRow } from "./components/TaskRow";
import type { Project, Tag, Task } from "./types";

export default function App() {
  const userId = useMemo(() => getOrCreateUserId(), []);
  const api = useMemo(() => createApi(userId), [userId]);

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [selected, setSelected] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("Inbox");

  const defaultProjectId = projectFilter || projects[0]?.id || "";

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
    const res = await api.listTasks(
      projectFilter ? { project_id: projectFilter, sort: "position" } : { sort: "position" },
    );
    setTasks(res.tasks);
  }, [api, projectFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.ensureUser();
        if (cancelled) return;
        await refreshProjects();
        if (cancelled) return;
        await refreshTags();
        if (cancelled) return;
        await refreshTasks();
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
  }, [api, refreshProjects, refreshTags, refreshTasks]);

  useEffect(() => {
    if (!ready) return;
    void refreshTasks();
  }, [projectFilter, ready, refreshTasks]);

  useEffect(() => {
    if (!selected) return;
    const still = tasks.find((t) => t.id === selected.id);
    if (still) setSelected(still);
  }, [tasks, selected]);

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
      setProjectFilter(p.id);
      setNewProjectName("Inbox");
    } catch (err) {
      setBootError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setCreatingProject(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="max-w-md text-center">
          {bootError ? (
            <p className="text-red-300">{bootError}</p>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-violet-500/40" />
              <p className="text-sm text-zinc-400">Connecting to TodoFlow…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Welcome to TodoFlow</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Create your first project to start adding tasks.
          </p>
        </div>
        {bootError && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {bootError}
          </p>
        )}
        <form
          onSubmit={handleCreateProject}
          className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-raised/60 p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-300">Project name</span>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
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
    <div className="min-h-screen bg-gradient-to-b from-surface to-zinc-950">
      <header className="border-b border-surface-border bg-surface-raised/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">TodoFlow</h1>
            <p className="text-xs text-zinc-500">Tasks · list & detail</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <span>Project</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="rounded-lg border border-surface-border bg-surface px-2 py-1.5 text-zinc-100"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-violet-500"
            >
              {showCreateForm ? "Close form" : "New task"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
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
            <h2 className="text-sm font-medium text-zinc-400">
              {projectFilter
                ? `Tasks in ${projects.find((p) => p.id === projectFilter)?.name ?? "project"}`
                : "All tasks"}
            </h2>
            {tasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-surface-border bg-surface-raised/30 px-4 py-8 text-center text-sm text-zinc-500">
                No tasks yet. Create one with &ldquo;New task&rdquo;.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    selected={selected?.id === t.id}
                    onSelect={(task) => setSelected(task)}
                  />
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
      </main>
    </div>
  );
}
