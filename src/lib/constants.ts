export const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
} as const

export const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const

export const STATUS_LABELS = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
} as const

export const STATUS_COLUMNS: Array<'todo' | 'in_progress' | 'done'> = [
  'todo',
  'in_progress',
  'done',
]
