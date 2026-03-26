import type {
  Project, ProjectInput, Task, TaskInput, TaskUpdate,
  PositionUpdate, TaskListResult, TaskCalendarResult, Subtask, SubtaskInput,
  Tag, TagInput, Dashboard, SavedFilter, SavedFilterInput,
  TaskFilter,
} from '../types'

function apiBaseUrl(): string | undefined {
  const base = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined
  return base && base.trim() ? base : undefined
}

function resolveApiUrl(path: string): string {
  const base = apiBaseUrl()
  const fullPath = `/api${path}`
  if (!base) return fullPath
  try {
    return new URL(fullPath, base).toString()
  } catch {
    return fullPath
  }
}

function getUserId(): string {
  let id = localStorage.getItem('todoflow-user-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('todoflow-user-id', id)
  }
  return id
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Users
export const ensureUser = () => request<void>('/users', { method: 'POST' })

// Projects
export const listProjects = () => request<Project[]>('/projects')
export const getProject = (id: string) => request<Project>(`/projects/${id}`)
export const createProject = (input: ProjectInput) =>
  request<Project>('/projects', { method: 'POST', body: JSON.stringify(input) })
export const updateProject = (id: string, input: ProjectInput) =>
  request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteProject = (id: string) =>
  request<void>(`/projects/${id}`, { method: 'DELETE' })

// Tasks
export const listTasks = (filter?: TaskFilter) => {
  const params = new URLSearchParams()
  if (filter) {
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v))
    })
  }
  const qs = params.toString()
  return request<TaskListResult>(`/tasks${qs ? `?${qs}` : ''}`)
}

export type TaskCalendarQuery = {
  from: string
  to: string
  project_id?: string
  status?: string
  priority?: string
  tag_id?: string
}

export const listTasksCalendar = (q: TaskCalendarQuery) => {
  const params = new URLSearchParams({ from: q.from, to: q.to })
  if (q.project_id) params.set('project_id', q.project_id)
  if (q.status) params.set('status', q.status)
  if (q.priority) params.set('priority', q.priority)
  if (q.tag_id) params.set('tag_id', q.tag_id)
  return request<TaskCalendarResult>(`/tasks/calendar?${params}`)
}
export const getTask = (id: string) => request<Task>(`/tasks/${id}`)
export const createTask = (input: TaskInput) =>
  request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) })
export const updateTask = (id: string, input: TaskUpdate) =>
  request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteTask = (id: string) =>
  request<void>(`/tasks/${id}`, { method: 'DELETE' })
export const updateTaskPosition = (id: string, input: PositionUpdate) =>
  request<Task>(`/tasks/${id}/position`, { method: 'PATCH', body: JSON.stringify(input) })

// Subtasks
export const listSubtasks = (taskId: string) =>
  request<Subtask[]>(`/tasks/${taskId}/subtasks`)
export const createSubtask = (taskId: string, input: SubtaskInput) =>
  request<Subtask>(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(input) })
export const updateSubtask = (id: string, input: SubtaskInput) =>
  request<Subtask>(`/subtasks/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteSubtask = (id: string) =>
  request<void>(`/subtasks/${id}`, { method: 'DELETE' })
export const toggleSubtask = (id: string) =>
  request<Subtask>(`/subtasks/${id}/toggle`, { method: 'PATCH' })

// Tags
export const listTags = () => request<Tag[]>('/tags')
export const createTag = (input: TagInput) =>
  request<Tag>('/tags', { method: 'POST', body: JSON.stringify(input) })
export const updateTag = (id: string, input: TagInput) =>
  request<Tag>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteTag = (id: string) =>
  request<void>(`/tags/${id}`, { method: 'DELETE' })
export const attachTag = (taskId: string, tagId: string) =>
  request<void>(`/tasks/${taskId}/tags/${tagId}`, { method: 'POST' })
export const detachTag = (taskId: string, tagId: string) =>
  request<void>(`/tasks/${taskId}/tags/${tagId}`, { method: 'DELETE' })

// Dashboard
export const getDashboard = () => request<Dashboard>('/dashboard')

// Search
export const searchTasks = (q: string, limit = 20) =>
  request<Task[]>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)

// Filters
export const listFilters = () => request<SavedFilter[]>('/filters')
export const createFilter = (input: SavedFilterInput) =>
  request<SavedFilter>('/filters', { method: 'POST', body: JSON.stringify(input) })
export const updateFilter = (id: string, input: SavedFilterInput) =>
  request<SavedFilter>(`/filters/${id}`, { method: 'PUT', body: JSON.stringify(input) })
export const deleteFilter = (id: string) =>
  request<void>(`/filters/${id}`, { method: 'DELETE' })

export { getUserId }
