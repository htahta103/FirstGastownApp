import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import type { Activity } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui'

function actionLabel(action: string) {
  switch (action) {
    case 'created':
      return { text: 'Created', className: 'text-sky-600 dark:text-sky-400' }
    case 'completed':
      return { text: 'Completed', className: 'text-emerald-600 dark:text-emerald-400' }
    case 'updated':
      return { text: 'Updated', className: 'text-amber-600 dark:text-amber-400' }
    default:
      return { text: action, className: 'text-slate-500 dark:text-gray-400' }
  }
}

export function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <Card variant="default" className="border-slate-200/70 dark:border-white/[0.08]">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest changes to your tasks</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[min(24rem,50vh)] space-y-0 overflow-y-auto px-6 pb-5 pt-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-gray-600">No activity yet</p>
        ) : (
          <ul className="divide-y divide-slate-200/80 dark:divide-white/[0.06]">
            {items.map((a, i) => {
              const meta = actionLabel(a.action)
              const when = formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex gap-3 py-3 first:pt-0"
                >
                  <div
                    className={`mt-0.5 size-2 shrink-0 rounded-full bg-current ${meta.className}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 dark:text-gray-200">
                      <span className={`font-medium ${meta.className}`}>{meta.text}</span>{' '}
                      <span className="text-slate-400 dark:text-gray-400">·</span>{' '}
                      <span className="text-slate-700 dark:text-gray-300">{a.task_title}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-600">{when}</p>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
