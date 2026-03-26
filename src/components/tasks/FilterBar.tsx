import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { createFilter, deleteFilter, listFilters } from '../../api/client'
import type { Project, Tag } from '../../types'
import {
  defaultTaskListFilterState,
  filterStateToApi,
  savedJsonToTaskFilter,
  taskFilterToFilterState,
  taskFilterToSavedJson,
  type DuePreset,
  type TaskListFilterState,
} from '../../lib/taskFilterHelpers'
import { Button, Input, Modal, Select, toast } from '../ui'

const dueOptions: { value: DuePreset; label: string }[] = [
  { value: 'any', label: 'Any due date' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Due this week' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'custom', label: 'Custom range' },
]

const statusOptions = [
  { value: '', label: 'Any status' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

const priorityOptions = [
  { value: '', label: 'Any priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const sortOptions = [
  { value: 'position', label: 'Manual order' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created_at', label: 'Recently created' },
]

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function FilterBar({
  state,
  onChange,
  projects,
  tags,
  calendarMode = false,
}: {
  state: TaskListFilterState
  onChange: (next: TaskListFilterState) => void
  projects: Project[]
  tags: Tag[]
  /** Hide due + sort; calendar grid supplies the date range. */
  calendarMode?: boolean
}) {
  const qc = useQueryClient()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')

  const filtersQ = useQuery({ queryKey: ['saved-filters'], queryFn: listFilters })

  const createMut = useMutation({
    mutationFn: (name: string) =>
      createFilter({
        name: name.trim(),
        filter_json: taskFilterToSavedJson(filterStateToApi(state)),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['saved-filters'] })
      setSaveOpen(false)
      setSaveName('')
      toast({ message: 'Saved filter created', type: 'success' })
    },
    onError: (e: Error) => toast({ message: e.message, type: 'error' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['saved-filters'] })
      toast({ message: 'Filter removed', type: 'success' })
    },
    onError: (e: Error) => toast({ message: e.message, type: 'error' }),
  })

  const projectOptions = [
    { value: '', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ]

  const tagOptions = [
    { value: '', label: 'Any tag' },
    ...tags.map((t) => ({ value: t.id, label: t.name })),
  ]

  const setDuePreset = (preset: DuePreset) => {
    if (preset === 'custom') {
      onChange({
        ...state,
        duePreset: 'custom',
        customRange: state.customRange ?? { from: todayISO(), to: todayISO() },
      })
      return
    }
    onChange({ ...state, duePreset: preset, customRange: null })
  }

  const applySaved = (filterJson: Record<string, unknown>) => {
    const parsed = savedJsonToTaskFilter(filterJson)
    onChange(taskFilterToFilterState(parsed))
  }

  const isDefaultState = calendarMode
    ? !state.project_id && !state.status && !state.priority && !state.tag_id
    : !state.project_id &&
      !state.status &&
      !state.priority &&
      !state.tag_id &&
      state.duePreset === 'any' &&
      state.sort === 'position'

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white/70 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-gray-100">
              Filters
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-gray-500">
              {calendarMode
                ? 'Project, status, priority, and tag apply to tasks shown on the calendar. Due range comes from the visible month or week.'
                : 'Combine project, status, priority, tag, and due date. All apply together.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSaveOpen(true)}
              disabled={isDefaultState}
            >
              Save as preset
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(defaultTaskListFilterState())}
              disabled={isDefaultState}
            >
              Clear all
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Project"
            options={projectOptions}
            value={state.project_id}
            onChange={(e) => onChange({ ...state, project_id: e.target.value })}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={state.status}
            onChange={(e) => onChange({ ...state, status: e.target.value })}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            value={state.priority}
            onChange={(e) => onChange({ ...state, priority: e.target.value })}
          />
          <Select
            label="Tag"
            options={tagOptions}
            value={state.tag_id}
            onChange={(e) => onChange({ ...state, tag_id: e.target.value })}
          />
          {!calendarMode && (
            <>
              <Select
                label="Due date"
                options={dueOptions}
                value={state.duePreset}
                onChange={(e) => setDuePreset(e.target.value as DuePreset)}
              />
              <Select
                label="Sort"
                options={sortOptions}
                value={state.sort}
                onChange={(e) =>
                  onChange({ ...state, sort: e.target.value as TaskListFilterState['sort'] })
                }
              />
            </>
          )}
        </div>

        {!calendarMode && state.duePreset === 'custom' && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="From"
              type="date"
              value={state.customRange?.from ?? ''}
              onChange={(e) =>
                onChange({
                  ...state,
                  customRange: {
                    from: e.target.value,
                    to: state.customRange?.to ?? todayISO(),
                  },
                })
              }
            />
            <Input
              label="To"
              type="date"
              value={state.customRange?.to ?? ''}
              onChange={(e) =>
                onChange({
                  ...state,
                  customRange: {
                    from: state.customRange?.from ?? todayISO(),
                    to: e.target.value,
                  },
                })
              }
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
          Saved presets
        </p>
        {filtersQ.isLoading && (
          <p className="mt-2 text-sm text-slate-600 dark:text-gray-500">Loading…</p>
        )}
        {filtersQ.isError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {(filtersQ.error as Error).message}
          </p>
        )}
        {filtersQ.data && filtersQ.data.length === 0 && (
          <p className="mt-2 text-sm text-slate-600 dark:text-gray-500">
            No saved presets yet. Tune filters above, then click &quot;Save as preset&quot;.
          </p>
        )}
        {filtersQ.data && filtersQ.data.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {filtersQ.data.map((f) => (
              <li
                key={f.id}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 pl-3 pr-1 dark:border-white/[0.1] dark:bg-white/[0.05]"
              >
                <button
                  type="button"
                  className="py-2 text-sm font-medium text-violet-700 dark:text-violet-300"
                  onClick={() => applySaved(f.filter_json)}
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label={`Delete ${f.name}`}
                  onClick={() => {
                    if (window.confirm(`Remove saved filter “${f.name}”?`)) deleteMut.mutate(f.id)
                  }}
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save filter preset" size="sm">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Work · urgent · this week"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && saveName.trim()) createMut.mutate(saveName)
            }}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={createMut.isPending}
              disabled={!saveName.trim()}
              onClick={() => createMut.mutate(saveName)}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
