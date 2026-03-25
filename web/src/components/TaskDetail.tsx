import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Api } from "../api/client";
import type { Project, Subtask, Tag, Task } from "../types";
import { TaskForm } from "./TaskForm";

export interface TaskDetailProps {
  api: Api;
  task: Task | null;
  projects: Project[];
  tags: Tag[];
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: () => void;
  onClose: () => void;
}

export function TaskDetail({
  api,
  task,
  projects,
  tags,
  onTaskUpdated,
  onTaskDeleted,
  onClose,
}: TaskDetailProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const loadSubtasks = useCallback(async () => {
    if (!task) {
      setSubtasks([]);
      return;
    }
    setLoadingSubs(true);
    setError(null);
    try {
      const list = await api.listSubtasks(task.id);
      setSubtasks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subtasks");
    } finally {
      setLoadingSubs(false);
    }
  }, [api, task]);

  useEffect(() => {
    void loadSubtasks();
    setEditing(false);
  }, [loadSubtasks, task?.id]);

  async function addSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newTitle.trim()) return;
    setBusyId("new");
    setError(null);
    try {
      await api.createSubtask(task.id, newTitle.trim());
      setNewTitle("");
      await loadSubtasks();
      const refreshed = await api.getTask(task.id);
      onTaskUpdated(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add subtask");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSubtask(s: Subtask) {
    setBusyId(s.id);
    setError(null);
    try {
      await api.toggleSubtask(s.id);
      await loadSubtasks();
      if (task) {
        const refreshed = await api.getTask(task.id);
        onTaskUpdated(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeSubtask(s: Subtask) {
    if (!window.confirm("Remove this subtask?")) return;
    setBusyId(s.id);
    setError(null);
    try {
      await api.deleteSubtask(s.id);
      await loadSubtasks();
      if (task) {
        const refreshed = await api.getTask(task.id);
        onTaskUpdated(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!task) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-raised/40 p-8 text-center text-sm text-zinc-500">
        <p className="max-w-xs">Select a task to view details and subtasks.</p>
      </div>
    );
  }

  const project = projects.find((p) => p.id === task.project_id);

  return (
    <motion.aside
      layout
      className="flex h-full max-h-[calc(100vh-6rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-surface-border bg-surface-raised/40 p-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Task</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">{task.title}</h2>
          {project && (
            <p className="mt-1 text-sm text-zinc-400">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: project.color || "#6366f1" }}
              />
              {project.name}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {!editing && (
        <div className="space-y-3 rounded-lg border border-surface-border bg-surface/60 p-3 text-sm text-zinc-300">
          {task.description ? (
            <p className="whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-zinc-500">No description</p>
          )}
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Due</dt>
              <dd className="font-mono text-zinc-200">{task.due_date ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Priority</dt>
              <dd className="capitalize text-zinc-200">{task.priority}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="capitalize text-zinc-200">{task.status.replace("_", " ")}</dd>
            </div>
          </dl>
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {task.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: t.color || "#6366f1" }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-white/15"
          >
            Edit task
          </button>
        </div>
      )}

      {editing && (
        <TaskForm
          api={api}
          projects={projects}
          tags={tags}
          mode="edit"
          task={task}
          defaultProjectId={task.project_id}
          onSaved={(t) => {
            onTaskUpdated(t);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          onDeleted={() => {
            onTaskDeleted();
            setEditing(false);
          }}
        />
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Subtasks</h3>
          {loadingSubs && <span className="text-xs text-zinc-500">Loading…</span>}
        </div>

        <form onSubmit={addSubtask} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a subtask"
            className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          />
          <button
            type="submit"
            disabled={busyId !== null || !newTitle.trim()}
            className="shrink-0 rounded-lg bg-zinc-700 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Add
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {subtasks.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface/80 px-2 py-2"
              >
                <input
                  type="checkbox"
                  checked={s.completed}
                  disabled={busyId === s.id}
                  onChange={() => void toggleSubtask(s)}
                  className="h-4 w-4 rounded border-zinc-600 bg-surface text-violet-600 focus:ring-violet-500"
                  aria-label={`Toggle ${s.title}`}
                />
                <span
                  className={`min-w-0 flex-1 text-sm ${
                    s.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                  }`}
                >
                  {s.title}
                </span>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void removeSubtask(s)}
                  className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                >
                  Remove
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {!loadingSubs && subtasks.length === 0 && (
          <p className="text-xs text-zinc-500">No subtasks yet.</p>
        )}
      </section>
    </motion.aside>
  );
}
