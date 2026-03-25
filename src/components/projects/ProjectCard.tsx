import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import { displayProjectIcon } from '../../lib/projectUi'
import { Button, Card, CardContent } from '../ui'

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  index = 0,
}: {
  project: Project
  onEdit: () => void
  onDelete: () => void
  index?: number
}) {
  const glyph = displayProjectIcon(project.icon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Card
        variant="default"
        className="group h-full overflow-hidden border-slate-200/70 dark:border-white/[0.08]"
        hoverable
      >
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
          aria-hidden
        />
        <CardContent className="flex h-full flex-col gap-4">
          <Link
            to={`/project/${project.id}`}
            className="min-w-0 flex-1 rounded-xl outline-none ring-violet-400/0 transition-[ring] focus-visible:ring-2"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-2xl dark:border-white/[0.08] dark:bg-white/[0.04]"
                style={{ boxShadow: `0 0 24px -4px ${project.color}55` }}
              >
                {glyph}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-violet-700 dark:text-gray-100 dark:group-hover:text-violet-200">
                  {project.name}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-gray-600">
                  {project.task_count} task{project.task_count === 1 ? '' : 's'}
                </p>
                <p className="mt-2 font-mono text-[10px] text-slate-500 dark:text-gray-600">{project.color}</p>
              </div>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-4 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
