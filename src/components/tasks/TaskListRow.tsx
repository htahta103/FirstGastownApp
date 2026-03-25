import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Task } from '../../types'
import { displayProjectIcon } from '../../lib/projectUi'
import type { Project } from '../../types'

const priorityDot: Record<Task['priority'], string> = {
  urgent: 'bg-rose-500',
  high: 'bg-amber-500',
  medium: 'bg-sky-500',
  low: 'bg-slate-400 dark:bg-gray-600',
}

const statusLabel: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export function TaskListRow({
  task,
  project,
  onOpen,
}: {
  task: Task
  project?: Project
  onOpen: () => void
}) {
  const sub =
    task.subtask_total > 0 ? `${task.subtask_completed}/${task.subtask_total}` : null
  const glyph = project ? displayProjectIcon(project.icon) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="group flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-sm
        dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none"
    >
      <span className={`w-1 shrink-0 ${priorityDot[task.priority]}`} aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`truncate font-medium tracking-tight text-slate-900 dark:text-gray-100 ${
              task.status === 'done' ? 'text-slate-500 line-through dark:text-gray-500' : ''
            }`}
          >
            {task.title}
          </span>
          <span className="shrink-0 rounded-lg border border-slate-200/90 bg-slate-50/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-400">
            {statusLabel[task.status]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-gray-500">
          {project && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2 py-0.5 dark:bg-white/[0.06]">
              {glyph && <span className="text-sm leading-none">{glyph}</span>}
              <span className="max-w-[10rem] truncate font-medium text-slate-700 dark:text-gray-300">
                {project.name}
              </span>
            </span>
          )}
          {task.due_date && (
            <span className="rounded-md bg-violet-500/10 px-2 py-0.5 font-mono text-violet-800 dark:text-violet-200">
              Due {task.due_date}
            </span>
          )}
          <span className="capitalize">{task.priority}</span>
          {sub && (
            <span>
              Subtasks <span className="font-mono">{sub}</span>
            </span>
          )}
          {task.tags?.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {task.tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: t.color || '#6366f1' }}
                >
                  {t.name}
                </span>
              ))}
            </span>
          )}
        </div>
      </button>
      {project && (
        <Link
          to={`/project/${project.id}`}
          className="flex shrink-0 items-center border-l border-slate-200/80 px-3 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:border-white/[0.08] dark:text-violet-300 dark:hover:bg-white/[0.04]"
          onClick={(e) => e.stopPropagation()}
        >
          Project
        </Link>
      )}
    </motion.div>
  )
}
