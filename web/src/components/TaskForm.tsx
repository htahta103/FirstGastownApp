import { useEffect, useMemo, useState } from "react";
import type { Api } from "../api/client";
import type { Project, Tag, Task, TaskPriority, TaskStatus } from "../types";

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];
const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

export interface TaskFormValues {
  project_id: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  tag_ids: string[];
}

function taskToValues(task: Task): TaskFormValues {
  return {
    project_id: task.project_id,
    title: task.title,
    description: task.description ?? "",
    due_date: task.due_date ?? "",
    priority: task.priority,
    status: task.status,
    tag_ids: task.tags.map((t) => t.id),
  };
}

function emptyValues(projectId: string): TaskFormValues {
  return {
    project_id: projectId,
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    status: "todo",
    tag_ids: [],
  };
}

export interface TaskFormProps {
  api: Api;
  projects: Project[];
  tags: Tag[];
  mode: "create" | "edit";
  task?: Task | null;
  defaultProjectId: string;
  onSaved: (task: Task) => void;
  onCancel?: () => void;
  onDeleted?: () => void;
}

export function TaskForm({
  api,
  projects,
  tags,
  mode,
  task,
  defaultProjectId,
  onSaved,
  onCancel,
  onDeleted,
}: TaskFormProps) {
  const initial = useMemo(
    () => (mode === "edit" && task ? taskToValues(task) : emptyValues(defaultProjectId)),
    [mode, task, defaultProjectId],
  );

  const [values, setValues] = useState<TaskFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  async function syncTags(taskId: string, prevIds: string[], nextIds: string[]) {
    const prev = new Set(prevIds);
    const next = new Set(nextIds);
    for (const id of next) {
      if (!prev.has(id)) await api.attachTag(taskId, id);
    }
    for (const id of prev) {
      if (!next.has(id)) await api.detachTag(taskId, id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!values.project_id) {
      setError("Project is required");
      return;
    }
    setBusy(true);
    try {
      const desc = values.description.trim();
      const payload: Record<string, unknown> = {
        project_id: values.project_id,
        title: values.title.trim(),
        description: desc === "" ? null : desc,
        due_date: values.due_date === "" ? null : values.due_date,
        priority: values.priority,
        status: values.status,
      };

      if (mode === "create") {
        const created = await api.createTask(payload);
        await syncTags(created.id, [], values.tag_ids);
        const full = await api.getTask(created.id);
        onSaved(full);
      } else if (task) {
        const prevTagIds = task.tags.map((t) => t.id);
        await api.updateTask(task.id, payload);
        await syncTags(task.id, prevTagIds, values.tag_ids);
        const full = await api.getTask(task.id);
        onSaved(full);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!task || !onDeleted) return;
    if (!window.confirm("Delete this task?")) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteTask(task.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleTag(id: string) {
    setValues((v) => ({
      ...v,
      tag_ids: v.tag_ids.includes(id) ? v.tag_ids.filter((x) => x !== id) : [...v.tag_ids, id],
    }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-raised/80 p-4 shadow-lg backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {mode === "create" ? "New task" : "Edit task"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-300">Project</span>
        <select
          required
          value={values.project_id}
          onChange={(e) => setValues((v) => ({ ...v, project_id: e.target.value }))}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-300">Title</span>
        <input
          required
          maxLength={500}
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          placeholder="What needs doing?"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-300">Description</span>
        <textarea
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          rows={4}
          className="resize-y rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-sm text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          placeholder="Optional details"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-300">Due date</span>
          <input
            type="date"
            value={values.due_date}
            onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-300">Priority</span>
          <select
            value={values.priority}
            onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as TaskPriority }))}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-300">Status</span>
          <select
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as TaskStatus }))}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-zinc-100 outline-none ring-violet-500/40 focus:ring-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tags.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-300">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const on = values.tag_ids.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    on
                      ? "border-transparent text-white shadow"
                      : "border-surface-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                  }`}
                  style={
                    on
                      ? { backgroundColor: t.color || "#6366f1" }
                      : { borderColor: t.color || undefined }
                  }
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : mode === "create" ? "Create task" : "Save changes"}
        </button>
        {mode === "edit" && task && onDeleted && (
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
