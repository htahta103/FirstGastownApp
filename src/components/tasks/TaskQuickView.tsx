import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getTask } from '../../api/client'
import { Button, Modal, Skeleton } from '../ui'

export function TaskQuickView({
  taskId,
  onClose,
}: {
  taskId: string | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const q = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId!),
    enabled: Boolean(taskId),
  })

  const open = Boolean(taskId)

  return (
    <Modal open={open} onClose={onClose} title="Task" size="lg">
      {!taskId || q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : q.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{(q.error as Error).message}</p>
      ) : q.data ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-50">
              {q.data.title}
            </h3>
            {q.data.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-gray-400">
                {q.data.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-gray-500">No description</p>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
                Status
              </dt>
              <dd className="mt-0.5 capitalize text-slate-900 dark:text-gray-100">{q.data.status.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
                Priority
              </dt>
              <dd className="mt-0.5 capitalize text-slate-900 dark:text-gray-100">{q.data.priority}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
                Due
              </dt>
              <dd className="mt-0.5 font-mono text-slate-900 dark:text-gray-100">
                {q.data.due_date ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
                Subtasks
              </dt>
              <dd className="mt-0.5 text-slate-900 dark:text-gray-100">
                {q.data.subtask_completed} / {q.data.subtask_total}
              </dd>
            </div>
          </dl>
          {q.data.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-500">
                Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {q.data.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: t.color || '#6366f1' }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                navigate(`/project/${q.data.project_id}`)
                onClose()
              }}
            >
              Open project
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
