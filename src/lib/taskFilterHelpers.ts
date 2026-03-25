import { endOfWeek, format, startOfWeek, subDays } from 'date-fns'
import type { TaskFilter } from '../types'

export type DuePreset = 'any' | 'today' | 'week' | 'overdue' | 'custom'

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

export function duePresetToRange(
  preset: DuePreset,
  custom: { from: string; to: string } | null,
): Pick<TaskFilter, 'due_from' | 'due_to'> {
  const today = todayStr()
  switch (preset) {
    case 'any':
      return {}
    case 'today':
      return { due_from: today, due_to: today }
    case 'week': {
      const s = startOfWeek(new Date(), { weekStartsOn: 1 })
      const e = endOfWeek(new Date(), { weekStartsOn: 1 })
      return { due_from: format(s, 'yyyy-MM-dd'), due_to: format(e, 'yyyy-MM-dd') }
    }
    case 'overdue':
      return { due_to: format(subDays(new Date(), 1), 'yyyy-MM-dd') }
    case 'custom':
      if (custom?.from && custom?.to) return { due_from: custom.from, due_to: custom.to }
      return {}
    default:
      return {}
  }
}

export function detectDuePreset(filter: TaskFilter): {
  preset: DuePreset
  custom: { from: string; to: string } | null
} {
  const { due_from: from, due_to: to } = filter
  if (!from && !to) return { preset: 'any', custom: null }

  const today = todayStr()
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const yest = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  if (from === today && to === today) return { preset: 'today', custom: null }
  if (from === weekStart && to === weekEnd) return { preset: 'week', custom: null }
  if (!from && to === yest) return { preset: 'overdue', custom: null }

  if (from && to) return { preset: 'custom', custom: { from, to } }
  if (from || to) return { preset: 'custom', custom: { from: from ?? '', to: to ?? '' } }
  return { preset: 'any', custom: null }
}

const SORTS = ['position', 'due_date', 'priority', 'created_at'] as const

export type TaskSort = (typeof SORTS)[number]

export interface TaskListFilterState {
  project_id: string
  status: string
  priority: string
  tag_id: string
  duePreset: DuePreset
  customRange: { from: string; to: string } | null
  sort: TaskSort
}

export const defaultTaskListFilterState = (): TaskListFilterState => ({
  project_id: '',
  status: '',
  priority: '',
  tag_id: '',
  duePreset: 'any',
  customRange: null,
  sort: 'position',
})

export function filterStateToApi(s: TaskListFilterState): TaskFilter {
  const range = duePresetToRange(s.duePreset, s.customRange)
  return compactTaskFilter({
    ...(s.project_id && { project_id: s.project_id }),
    ...(s.status && { status: s.status }),
    ...(s.priority && { priority: s.priority }),
    ...(s.tag_id && { tag_id: s.tag_id }),
    ...range,
    sort: s.sort,
    limit: 200,
  })
}

/** Kanban: same as list filters except status (always all columns) and fixed sort/limit. */
export function filterStateToBoardApi(s: TaskListFilterState): TaskFilter {
  const range = duePresetToRange(s.duePreset, s.customRange)
  return compactTaskFilter({
    ...(s.project_id && { project_id: s.project_id }),
    ...(s.priority && { priority: s.priority }),
    ...(s.tag_id && { tag_id: s.tag_id }),
    ...range,
    sort: 'position',
    limit: 500,
  })
}

export function taskFilterToFilterState(f: TaskFilter): TaskListFilterState {
  const { preset, custom } = detectDuePreset(f)
  const sort = SORTS.includes(f.sort as TaskSort) ? (f.sort as TaskSort) : 'position'
  return {
    project_id: f.project_id ?? '',
    status: f.status ?? '',
    priority: f.priority ?? '',
    tag_id: f.tag_id ?? '',
    duePreset: preset,
    customRange: custom,
    sort,
  }
}

/** Build API-ready filter; omits empty strings and undefined. */
export function compactTaskFilter(parts: TaskFilter): TaskFilter {
  const out: TaskFilter = {}
  if (parts.project_id) out.project_id = parts.project_id
  if (parts.status) out.status = parts.status
  if (parts.priority) out.priority = parts.priority
  if (parts.tag_id) out.tag_id = parts.tag_id
  if (parts.due_from) out.due_from = parts.due_from
  if (parts.due_to) out.due_to = parts.due_to
  if (parts.sort) out.sort = parts.sort
  if (parts.limit != null) out.limit = parts.limit
  if (parts.offset != null) out.offset = parts.offset
  return out
}

export function taskFilterToSavedJson(filter: TaskFilter): Record<string, unknown> {
  const c = compactTaskFilter(filter)
  return { ...c } as Record<string, unknown>
}

export function savedJsonToTaskFilter(json: Record<string, unknown>): TaskFilter {
  const out: TaskFilter = { sort: 'position' }
  const pick = (k: keyof TaskFilter) => {
    const v = json[k as string]
    if (typeof v === 'string' && v.length > 0) (out as Record<string, string>)[k as string] = v
  }
  pick('project_id')
  pick('status')
  pick('priority')
  pick('tag_id')
  pick('due_from')
  pick('due_to')
  if (typeof json.sort === 'string' && SORTS.includes(json.sort as TaskSort)) {
    out.sort = json.sort as TaskSort
  }
  return out
}
