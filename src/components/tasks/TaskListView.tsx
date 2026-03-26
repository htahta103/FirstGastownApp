import { format, parseISO } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { updateTask } from '../../api/client'
import type { Project, Task } from '../../types'
import { PRIORITY_LABELS, STATUS_LABELS } from '../../lib/constants'
import { displayProjectIcon } from '../../lib/projectUi'
import { Button, Skeleton, toast } from '../ui'
import { TasksEmptyIllustration } from './TasksEmptyIllustration'

function TaskListRow({
  task,
  project,
  queryKey,
  onOpenTask,
}: {
  task: Task
  project?: Project
  queryKey: unknown[]
  onOpenTask?: (id: string) => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateTask>[1]) => updateTask(task.id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      // Calendar visibility depends on task fields (status/priority/tags) and user filters,
      // so ensure month/week views refresh after updates.
      void qc.invalidateQueries({ queryKey: ['tasks', 'calendar'] })
    },
    onError: (e: Error) => toast({ message: e.message, type: 'error' }),
  })

  const saveTitle = () => {
    const next = draft.trim()
    if (!next || next === task.title) {
      setEditing(false)
      return
    }
    mutation.mutate(
      { title: next },
      {
        onSettled: () => setEditing(false),
      },
    )
  }

  const startEdit = () => {
    setDraft(task.title)
    setEditing(true)
  }

  const due = task.due_date
    ? (() => {
        try {
          return format(parseISO(task.due_date), 'MMM d')
        } catch {
          return task.due_date
        }
      })()
    : '—'

  const glyph = project ? displayProjectIcon(project.icon) : '◆'

  return (
    <div
      className={`grid grid-cols-1 items-center gap-3 px-4 py-3 sm:gap-4 ${
        onOpenTask
          ? 'sm:grid-cols-[1fr_auto_auto_auto_auto_auto]'
          : 'sm:grid-cols-[1fr_auto_auto_auto_auto]'
      }`}
    >
      <div className="min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') {
                setEditing(false)
              }
            }}
            className="w-full rounded-lg border border-violet-400/40 bg-white/[0.05] px-2.5 py-1.5 text-sm text-gray-100 outline-none ring-2 ring-violet-500/20"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-full truncate text-left text-sm font-medium text-gray-100 hover:text-violet-200"
          >
            {task.title}
          </button>
        )}
        <p className="mt-1 text-[11px] text-gray-600 sm:hidden">Due {due}</p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {project && (
          <span
            className="inline-flex max-w-[8rem] items-center gap-1.5 truncate rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-gray-400"
            title={project.name}
          >
            <span className="shrink-0 text-sm">{glyph}</span>
            <span className="truncate">{project.name}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:contents">
        {onOpenTask && (
          <button
            type="button"
            onClick={() => onOpenTask(task.id)}
            className="rounded-lg border border-white/[0.1] px-2 py-1 text-xs text-violet-300 hover:bg-white/[0.06]"
          >
            Details
          </button>
        )}
        <select
          className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-violet-400/40"
          value={task.status}
          disabled={mutation.isPending}
          onChange={(e) =>
            mutation.mutate({ status: e.target.value as Task['status'] })
          }
          aria-label="Status"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-violet-400/40"
          value={task.priority}
          disabled={mutation.isPending}
          onChange={(e) =>
            mutation.mutate({ priority: e.target.value as Task['priority'] })
          }
          aria-label="Priority"
        >
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <span className="hidden w-14 shrink-0 text-right text-xs tabular-nums text-gray-500 sm:inline">
          {due}
        </span>
      </div>
    </div>
  )
}

export function TaskListView({
  tasks,
  total,
  isLoading,
  isError,
  error,
  onRetry,
  projectsById,
  queryKey,
  onOpenTask,
}: {
  tasks: Task[]
  total: number
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  projectsById: Map<string, Project>
  queryKey: unknown[]
  onOpenTask?: (id: string) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-2xl border border-white/[0.08] p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <p className="text-sm text-red-300">{error?.message ?? 'Failed to load tasks'}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <TasksEmptyIllustration className="mx-auto mb-6 w-48 text-violet-500/30" />
        <h2 className="text-lg font-semibold text-gray-200">No tasks match</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Try clearing filters or add a task from the dashboard quick add.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Showing <span className="tabular-nums text-gray-400">{tasks.length}</span> of{' '}
        <span className="tabular-nums text-gray-400">{total}</span>
      </p>
      <div className="hidden px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-600 sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:gap-4">
        <span>Task</span>
        <span>Project</span>
        {onOpenTask && <span />}
        <span>Status</span>
        <span>Priority</span>
        <span className="text-right">Due</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="divide-y divide-white/[0.06]">
          {tasks.map((t) => (
            <TaskListRow
              key={t.id}
              task={t}
              project={projectsById.get(t.project_id)}
              queryKey={queryKey}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
