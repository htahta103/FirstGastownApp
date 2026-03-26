import { useMemo } from 'react'
import { format, isSameMonth, isToday } from 'date-fns'
import type { Task, TaskCalendarResult } from '../../types'
import { PRIORITY_COLORS } from '../../lib/constants'
import type { CalendarGrain } from '../../lib/calendarGrid'
import { Button, Skeleton } from '../ui'

const WEEK_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function DayCell({
  day,
  faded,
  tasks,
  onOpenTask,
}: {
  day: Date
  faded: boolean
  tasks: Task[]
  onOpenTask: (id: string) => void
}) {
  const key = format(day, 'yyyy-MM-dd')
  const maxShow = 4

  return (
    <div
      className={`flex min-h-[6rem] flex-col border border-white/[0.06] bg-white/[0.02] sm:min-h-[7.5rem] ${
        faded ? 'opacity-45' : ''
      }`}
    >
      <div className="flex justify-end px-1.5 pt-1">
        <span
          className={`text-xs tabular-nums text-gray-500 ${
            isToday(day) ? 'rounded-full bg-violet-500/25 px-1.5 py-0.5 font-medium text-violet-200' : ''
          }`}
        >
          {format(day, 'd')}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1 pb-1.5">
        {tasks.slice(0, maxShow).map((t) => (
          <button
            key={`${key}-${t.id}`}
            type="button"
            onClick={() => onOpenTask(t.id)}
            title={t.title}
            className="w-full truncate rounded-md border-l-2 bg-white/[0.04] py-0.5 pl-1 pr-0.5 text-left text-[10px] font-medium leading-tight text-gray-200 transition-colors hover:bg-white/[0.08]"
            style={{ borderColor: PRIORITY_COLORS[t.priority] }}
          >
            {t.title}
          </button>
        ))}
        {tasks.length > maxShow && (
          <span className="text-[10px] text-gray-600">+{tasks.length - maxShow} more</span>
        )}
        {tasks.length === 0 && (
          <span className="mt-auto flex-1 text-[10px] text-gray-700" aria-hidden>
            &nbsp;
          </span>
        )}
      </div>
    </div>
  )
}

export function TaskCalendarView({
  grain,
  onGrainChange,
  cursor,
  onPrev,
  onNext,
  onToday,
  gridDays,
  focusAnchor,
  data,
  isLoading,
  isError,
  error,
  onRetry,
  onOpenTask,
}: {
  grain: CalendarGrain
  onGrainChange: (g: CalendarGrain) => void
  cursor: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  gridDays: Date[]
  /** Month view: dim days outside this month; week view: dim days outside this month for boundary weeks */
  focusAnchor: Date
  data: TaskCalendarResult | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  onOpenTask: (id: string) => void
}) {
  const tasksByDate = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const d of data?.days ?? []) {
      m.set(d.date, d.tasks)
    }
    return m
  }, [data])

  const title = useMemo(() => {
    if (grain === 'week') {
      const start = gridDays[0]
      const end = gridDays[gridDays.length - 1]
      if (!start || !end) return ''
      const sameYear = start.getFullYear() === end.getFullYear()
      return sameYear
        ? `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
        : `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
    }
    return format(cursor, 'MMMM yyyy')
  }, [grain, gridDays, cursor])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <p className="text-sm text-red-300">{error?.message ?? 'Failed to load calendar'}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-100">
            {title}
          </h2>
          {data != null && (
            <span className="text-xs tabular-nums text-slate-500 dark:text-gray-500">
              {data.total} task{data.total === 1 ? '' : 's'} with due dates
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200/90 bg-white/80 p-0.5 dark:border-white/[0.1] dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => onGrainChange('month')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                grain === 'month'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-600 dark:text-gray-500'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => onGrainChange('week')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                grain === 'week'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-600 dark:text-gray-500'
              }`}
            >
              Week
            </button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
          <div className="flex rounded-lg border border-slate-200/90 dark:border-white/[0.1]">
            <button
              type="button"
              onClick={onPrev}
              className="px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onNext}
              className="border-l border-slate-200/90 px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {data && data.total === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-gray-500">
          No tasks with due dates in this range. Add due dates to tasks or widen filters.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-white/[0.08]">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.03]">
            {WEEK_HEADERS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((day) => {
              const iso = format(day, 'yyyy-MM-dd')
              const faded =
                grain === 'month'
                  ? !isSameMonth(day, focusAnchor)
                  : !isSameMonth(day, cursor)
              return (
                <DayCell
                  key={iso}
                  day={day}
                  faded={faded}
                  tasks={tasksByDate.get(iso) ?? []}
                  onOpenTask={onOpenTask}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
