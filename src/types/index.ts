export interface Project {
  id: string
  name: string
  icon: string
  color: string
  task_count: number
  created_at: string
  updated_at: string
}

export interface ProjectInput {
  name: string
  icon?: string
  color?: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'done'
  position: number
  subtask_total: number
  subtask_completed: number
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface TaskInput {
  project_id: string
  title: string
  description?: string | null
  due_date?: string | null
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  status?: 'todo' | 'in_progress' | 'done'
}

export interface TaskUpdate {
  project_id?: string
  title?: string
  description?: string | null
  due_date?: string | null
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  status?: 'todo' | 'in_progress' | 'done'
}

export interface PositionUpdate {
  position: number
  status?: 'todo' | 'in_progress' | 'done'
}

export interface TaskListResult {
  tasks: Task[]
  total: number
}

export interface TaskCalendarDay {
  date: string
  tasks: Task[]
}

export interface TaskCalendarResult {
  from: string
  to: string
  days: TaskCalendarDay[]
  total: number
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface SubtaskInput {
  title: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface TagInput {
  name: string
  color?: string
}

export interface SavedFilter {
  id: string
  name: string
  filter_json: Record<string, unknown>
  created_at: string
}

export interface SavedFilterInput {
  name: string
  filter_json: Record<string, unknown>
}

export interface Dashboard {
  total_tasks: number
  completed_today: number
  overdue_count: number
  project_progress: ProjectProgress[]
  recent_activity: Activity[]
  upcoming_deadlines: Task[]
}

export interface ProjectProgress {
  project_id: string
  project_name: string
  total: number
  completed: number
}

export interface Activity {
  id: string
  action: 'created' | 'updated' | 'completed'
  task_title: string
  timestamp: string
}

export type TaskFilter = {
  project_id?: string
  status?: string
  priority?: string
  tag_id?: string
  due_from?: string
  due_to?: string
  sort?: 'position' | 'due_date' | 'priority' | 'created_at'
  limit?: number
  offset?: number
}
