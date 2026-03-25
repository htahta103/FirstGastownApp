import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listProjects, listTags, listTasks } from '../api/client'
import type { Project } from '../types'
import { PageTransition } from '../components/layout/PageTransition'
import { FilterBar } from '../components/tasks/FilterBar'
import { TaskListRow } from '../components/tasks/TaskListRow'
import { TaskQuickView } from '../components/tasks/TaskQuickView'
import { EmptyState, Skeleton } from '../components/ui'
import {
  defaultTaskListFilterState,
  filterStateToApi,
  type TaskListFilterState,
} from '../lib/taskFilterHelpers'

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const taskId = searchParams.get('task')

  const [filterState, setFilterState] = useState<TaskListFilterState>(defaultTaskListFilterState)
  const apiFilter = useMemo(() => filterStateToApi(filterState), [filterState])

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects })
  const tagsQ = useQuery({ queryKey: ['tags'], queryFn: listTags })
  const tasksQ = useQuery({
    queryKey: ['tasks', apiFilter],
    queryFn: () => listTasks(apiFilter),
  })

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

  return (
    <PageTransition>
      <div className="p-6 sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-gray-50">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-gray-400">
            Filter across projects, then open a task for details. Press{' '}
            <kbd className="rounded border border-slate-300/90 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-gray-200">
              ⌘
            </kbd>
            <kbd className="ml-0.5 rounded border border-slate-300/90 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-white/15 dark:bg-white/10 dark:text-gray-200">
              /
            </kbd>{' '}
            anywhere to search.
          </p>
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

        <section className="mt-8" aria-label="Task list">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200">Results</h2>
            {tasksQ.data && (
              <span className="text-xs text-slate-500 dark:text-gray-500">
                {tasksQ.data.tasks.length} of {tasksQ.data.total}
              </span>
            )}
          </div>

          {tasksQ.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          )}

          {tasksQ.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {(tasksQ.error as Error).message}
            </p>
          )}

          {tasksQ.data && tasksQ.data.tasks.length === 0 && (
            <EmptyState
              title="No tasks match"
              description="Relax a filter or add tasks from the dashboard."
            />
          )}

          {tasksQ.data && tasksQ.data.tasks.length > 0 && (
            <ul className="space-y-3">
              {tasksQ.data.tasks.map((t) => (
                <li key={t.id}>
                  <TaskListRow
                    task={t}
                    project={projectById.get(t.project_id)}
                    onOpen={() => openTask(t.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <TaskQuickView taskId={taskId} onClose={closeTask} />
    </PageTransition>
  )
}
