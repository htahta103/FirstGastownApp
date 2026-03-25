import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProjects } from '../api/client'
import type { Project } from '../types'
import { DeleteProjectModal } from '../components/projects/DeleteProjectModal'
import { ProjectCard } from '../components/projects/ProjectCard'
import { SaveProjectModal } from '../components/projects/SaveProjectModal'
import { Button, EmptyState, Skeleton } from '../components/ui'

export function ProjectsPage() {
  const { data: projects, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  return (
    <div className="p-6 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-50 sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize work with icons, colors, and quick access from the sidebar.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
          New project
        </Button>
      </header>

      {isLoading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-10 rounded-xl border border-red-500/20 bg-red-950/20 p-6">
          <p className="text-sm text-red-300">{(error as Error).message}</p>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking tasks."
            action={{ label: 'Create project', onClick: () => setCreateOpen(true) }}
          />
        </div>
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <SaveProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <SaveProjectModal
        open={Boolean(editing)}
        project={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteProjectModal project={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
