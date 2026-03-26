import { useMemo } from 'react'
import type { Project } from '../../types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui'
import { useUIStore } from '../../stores/uiStore'
import { TaskCreateForm } from '../tasks/TaskCreateForm'

export function QuickAddWidget({ projects }: { projects: Project[] }) {
  const preferredProjectId = useUIStore((s) => s.quickAddProjectId)
  const setPreferredProjectId = useUIStore((s) => s.setQuickAddProjectId)

  const defaultProjectId = useMemo(() => preferredProjectId ?? undefined, [preferredProjectId])

  return (
    <Card
      variant="default"
      className="border-violet-200/60 bg-gradient-to-br from-violet-100/80 via-white/40 to-transparent dark:border-violet-500/20 dark:from-violet-500/10 dark:via-transparent dark:to-transparent"
    >
      <CardHeader>
        <CardTitle>Quick add</CardTitle>
        <CardDescription>New task in a few keystrokes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-gray-500">
            Create a project first — then you can add tasks here.
          </p>
        ) : (
          <TaskCreateForm
            projects={projects}
            defaults={{ projectId: defaultProjectId }}
            onCreated={(t) => setPreferredProjectId(t.project_id)}
          />
        )}
      </CardContent>
    </Card>
  )
}
