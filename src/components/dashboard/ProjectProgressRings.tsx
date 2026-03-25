import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ProjectProgress } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '../ui'

function Ring({
  completed,
  total,
  label,
  color,
  projectId,
}: {
  completed: number
  total: number
  label: string
  color: string
  projectId: string
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)

  return (
    <Link
      to={`/project/${projectId}`}
      className="group flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
    >
      <div className="relative size-[5.5rem]">
        <svg className="-rotate-90 size-[5.5rem]" viewBox="0 0 80 80" aria-hidden>
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            className="stroke-slate-200 dark:stroke-white/[0.08]"
            strokeWidth="7"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-gray-100">{pct}%</span>
        </div>
      </div>
      <span className="max-w-[6.5rem] truncate text-center text-xs font-medium text-slate-600 group-hover:text-violet-600 dark:text-gray-400 dark:group-hover:text-violet-300">
        {label}
      </span>
      <span className="text-[10px] tabular-nums text-slate-500 dark:text-gray-600">
        {completed} / {total}
      </span>
    </Link>
  )
}

type Row = ProjectProgress & { color: string }

export function ProjectProgressRings({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <Card variant="subtle" className="border-dashed border-slate-300/90 dark:border-white/10">
        <CardContent className="py-10">
          <EmptyState
            title="No projects yet"
            description="Create a project to see progress rings here."
            icon="📁"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="default" hoverable={false} className="border-slate-200/70 dark:border-white/[0.08]">
      <CardHeader>
        <CardTitle>Progress by project</CardTitle>
        <CardDescription>Completion share per project — click to open</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {rows.map((p, i) => (
            <motion.div
              key={p.project_id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 26 }}
            >
              <Ring
                projectId={p.project_id}
                label={p.project_name}
                completed={p.completed}
                total={p.total}
                color={p.color && p.color.startsWith('#') ? p.color : '#a78bfa'}
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
