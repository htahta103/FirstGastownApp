import type { ApiErrorBody, Project, Subtask, Tag, Task, TaskListResult } from "../types";

const USER_KEY = "todoflow_user_id";

export function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/** Prevents infinite spinners when /api is missing (e.g. static hosting). */
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export function createApi(userId: string) {
  const headers = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
  };

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(path, {
        ...init,
        signal: controller.signal,
        headers: { ...headers, ...init?.headers },
      });
      if (!res.ok) {
        throw new Error(await parseError(res));
      }
      if (res.status === 204) {
        return undefined as T;
      }
      return (await res.json()) as T;
    } catch (err: unknown) {
      if (isAbortError(err)) {
        throw new Error("Request timed out — TodoFlow API is not available (static preview).");
      }
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return {
    ensureUser: () => request<unknown>("/api/users", { method: "POST", body: "{}" }),

    listProjects: () => request<Project[]>("/api/projects"),

    createProject: (body: { name: string; icon?: string; color?: string }) =>
      request<Project>("/api/projects", { method: "POST", body: JSON.stringify(body) }),

    listTasks: (params: Record<string, string | undefined>) => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) q.set(k, v);
      }
      const qs = q.toString();
      return request<TaskListResult>("/api/tasks" + (qs ? `?${qs}` : ""));
    },

    getTask: (id: string) => request<Task>(`/api/tasks/${id}`),

    createTask: (body: Record<string, unknown>) =>
      request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),

    updateTask: (id: string, body: Record<string, unknown>) =>
      request<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),

    deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),

    listSubtasks: (taskId: string) => request<Subtask[]>(`/api/tasks/${taskId}/subtasks`),

    createSubtask: (taskId: string, title: string) =>
      request<Subtask>(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title }),
      }),

    updateSubtask: (id: string, title: string) =>
      request<Subtask>(`/api/subtasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),

    toggleSubtask: (id: string) =>
      request<Subtask>(`/api/subtasks/${id}/toggle`, { method: "PATCH" }),

    deleteSubtask: (id: string) => request<void>(`/api/subtasks/${id}`, { method: "DELETE" }),

    listTags: () => request<Tag[]>("/api/tags"),

    attachTag: (taskId: string, tagId: string) =>
      request<void>(`/api/tasks/${taskId}/tags/${tagId}`, { method: "POST" }),

    detachTag: (taskId: string, tagId: string) =>
      request<void>(`/api/tasks/${taskId}/tags/${tagId}`, { method: "DELETE" }),

    searchTasks: (q: string) => {
      const qs = new URLSearchParams({ q, limit: "30" }).toString();
      return request<Task[]>(`/api/search?${qs}`);
    },

    updateTaskPosition: (id: string, body: { position: number; status?: string }) =>
      request<Task>(`/api/tasks/${id}/position`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
  };
}

export type Api = ReturnType<typeof createApi>;
