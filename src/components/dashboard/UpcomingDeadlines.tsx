import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Task } from '../../types'
import { PRIORITY_LABELS } from '../../lib/constants'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui'

function dueLabel(due: string) {
  const d = parseISO(due)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

const priorityVariant = {
  urgent: 'danger' as const,
  high: 'warning' as const,
  medium: 'info' as const,
  low: 'default' as const,
}

export function UpcomingDeadlines({ tasks }: { tasks: Task[] }) {
  return (
    <Card variant="default" className="border-white/[0.08]">
      <CardHeader>
        <CardTitle>Upcoming deadlines</CardTitle>
        <CardDescription>Next 7 days · not done</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[min(24rem,50vh)] space-y-0 overflow-y-auto px-6 pb-5 pt-2">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nothing due this week</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t, i) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/project/${t.project_id}`}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-violet-500/25 hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-100">{t.title}</p>
                    <p className="mt-0.5 text-xs text-violet-400/90">
                      {t.due_date ? dueLabel(t.due_date) : '—'}
                    </p>
                  </div>
                  <Badge variant={priorityVariant[t.priority]} size="sm">
                    {PRIORITY_LABELS[t.priority]}
                  </Badge>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
