import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listProjects, listTags, listTasks } from '../api/client'
import type { Project } from '../types'
import { PageTransition } from '../components/layout/PageTransition'
import { FilterBar } from '../components/tasks/FilterBar'
import { TaskBoardView } from '../components/tasks/TaskBoardView'
import { TaskListView } from '../components/tasks/TaskListView'
import { TaskQuickView } from '../components/tasks/TaskQuickView'
import { Skeleton } from '../components/ui'
import {
  defaultTaskListFilterState,
  filterStateToApi,
  filterStateToBoardApi,
  type TaskListFilterState,
} from '../lib/taskFilterHelpers'

type TasksViewMode = 'list' | 'board'

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const taskId = searchParams.get('task')
  const view: TasksViewMode = searchParams.get('view') === 'board' ? 'board' : 'list'

  const setView = (v: TasksViewMode) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.set('view', v)
        return p
      },
      { replace: true },
    )
  }

  const [filterState, setFilterState] = useState<TaskListFilterState>(() => defaultTaskListFilterState())

  const listApiFilter = useMemo(() => filterStateToApi(filterState), [filterState])
  const boardApiFilter = useMemo(() => filterStateToBoardApi(filterState), [filterState])
  const activeFilter = view === 'board' ? boardApiFilter : listApiFilter

  const queryKey = useMemo(() => ['tasks', view, activeFilter] as const, [view, activeFilter])

  const tasksQ = useQuery({
    queryKey: [...queryKey],
    queryFn: () => listTasks(activeFilter),
  })

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects })
  const tagsQ = useQuery({ queryKey: ['tags'], queryFn: listTags })

  const projectById = useMemo(() => {
    const m = new Map<string, Project>()
    for (const p of projectsQ.data ?? []) m.set(p.id, p)
    return m
  }, [projectsQ.data])

  const closeTask = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('task')
    setSearchParams(next, { replace: true })
  }

  const openTask = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('task', id)
    setSearchParams(next, { replace: true })
  }

  const tasks = tasksQ.data?.tasks ?? []
  const total = tasksQ.data?.total ?? 0

  return (
    <PageTransition>
      <div className="p-6 sm:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-gray-50">
              Tasks
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-gray-400">
              {view === 'board'
                ? 'Board shows Todo · In progress · Done. Status filter applies to list view only.'
                : 'Filter tasks, edit inline, or open details. Press '}
              {view === 'list' && (
                <>
                  <kbd className="rounded border border-slate-300/90 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-gray-200">
                    ⌘
                  </kbd>
                  <kbd className="ml-0.5 rounded border border-slate-300/90 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-gray-200">
                    /
                  </kbd>{' '}
                  anywhere to search.
                </>
              )}
            </p>
          </div>
          <div className="inline-flex shrink-0 rounded-xl border border-slate-200/90 bg-white/80 p-1 dark:border-white/[0.1] dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-600 hover:text-slate-900 dark:text-gray-500 dark:hover:text-gray-200'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                view === 'board'
                  ? 'bg-violet-500/20 text-violet-200'
                  : 'text-slate-600 hover:text-slate-900 dark:text-gray-500 dark:hover:text-gray-200'
              }`}
            >
              Board
            </button>
          </div>
        </div>

        {projectsQ.isLoading || tagsQ.isLoading ? (
          <Skeleton className="h-48 w-full max-w-4xl rounded-2xl" />
        ) : (
          <FilterBar
            state={filterState}
            onChange={setFilterState}
            projects={projectsQ.data ?? []}
            tags={tagsQ.data ?? []}
          />
        )}

        <section className="mt-8" aria-label={view === 'list' ? 'Task list' : 'Task board'}>
          {view === 'list' ? (
            <TaskListView
              tasks={tasks}
              total={total}
              isLoading={tasksQ.isLoading}
              isError={tasksQ.isError}
              error={tasksQ.error as Error | null}
              onRetry={() => void tasksQ.refetch()}
              projectsById={projectById}
              queryKey={[...queryKey]}
              onOpenTask={openTask}
            />
          ) : (
            <TaskBoardView
              tasks={tasks}
              isLoading={tasksQ.isLoading}
              isError={tasksQ.isError}
              error={tasksQ.error as Error | null}
              onRetry={() => void tasksQ.refetch()}
              queryKey={queryKey}
            />
          )}
        </section>
      </div>

      <TaskQuickView taskId={taskId} onClose={closeTask} />
    </PageTransition>
  )
}
