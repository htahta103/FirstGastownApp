import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getProject } from '../api/client'
import type { Project } from '../types'
import { displayProjectIcon } from '../lib/projectUi'
import { DeleteProjectModal } from '../components/projects/DeleteProjectModal'
import { SaveProjectModal } from '../components/projects/SaveProjectModal'
import { Button, Card, CardContent, Skeleton } from '../components/ui'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const q = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: Boolean(projectId),
  })

  if (!projectId) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Missing project id.</p>
        <Link to="/projects" className="mt-2 inline-block text-violet-400 hover:text-violet-300">
          ← Projects
        </Link>
      </div>
    )
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full max-w-xl rounded-2xl" />
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <div className="p-8">
        <p className="text-red-400">{(q.error as Error)?.message ?? 'Project not found.'}</p>
        <Link to="/projects" className="mt-4 inline-block text-violet-400 hover:text-violet-300">
          ← All projects
        </Link>
      </div>
    )
  }

  const p = q.data
  const glyph = displayProjectIcon(p.icon)

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] text-3xl"
            style={{
              backgroundColor: `${p.color}22`,
              boxShadow: `0 0 40px -8px ${p.color}66`,
            }}
          >
            {glyph}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-50 sm:text-3xl">
              {p.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {p.task_count} task{p.task_count === 1 ? '' : 's'} ·{' '}
              <span className="font-mono text-gray-600">{p.color}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(p)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-400"
                onClick={() => setDeleting(p)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
        <Link
          to="/tasks"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-white/[0.04]"
        >
          View all tasks →
        </Link>
      </div>

      <Card variant="subtle" className="mt-10 max-w-2xl border-dashed border-white/10">
        <CardContent>
          <p className="text-sm text-gray-500">
            Task board and filters for this project can live here next. For now, use{' '}
            <Link to="/tasks" className="text-violet-400 hover:text-violet-300">
              Tasks
            </Link>{' '}
            or the dashboard quick add with this project selected.
          </p>
        </CardContent>
      </Card>

      <SaveProjectModal open={Boolean(editing)} project={editing} onClose={() => setEditing(null)} />
      <DeleteProjectModal project={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
