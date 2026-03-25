import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui'

const items = [
  {
    key: 'total',
    label: 'Total tasks',
    valueKey: 'total_tasks' as const,
    sub: 'Across all projects',
    accent: 'from-violet-500/20 to-fuchsia-500/5',
    border: 'border-violet-500/20',
  },
  {
    key: 'done',
    label: 'Completed today',
    valueKey: 'completed_today' as const,
    sub: 'Marked done today',
    accent: 'from-emerald-500/20 to-teal-500/5',
    border: 'border-emerald-500/20',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    valueKey: 'overdue_count' as const,
    sub: 'Needs attention',
    accent: 'from-red-500/20 to-orange-500/5',
    border: 'border-red-500/25',
  },
] as const

type DashboardStats = {
  total_tasks: number
  completed_today: number
  overdue_count: number
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
        >
          <Card
            variant="subtle"
            className={`overflow-hidden border ${item.border} bg-gradient-to-br ${item.accent}`}
          >
            <CardContent className="py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-gray-50">
                {stats[item.valueKey]}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-600">{item.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
