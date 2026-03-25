export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";

export type SmartListFilter = "today" | "upcoming" | "overdue" | "completed";

export type NavMode =
  | { kind: "project"; projectId: string }
  | { kind: "smart"; filter: SmartListFilter };

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  task_count: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  subtask_total: number;
  subtask_completed: number;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface TaskListResult {
  tasks: Task[];
  total: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
