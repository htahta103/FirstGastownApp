import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, matchPath } from 'react-router-dom'
import { listProjects } from '../../api/client'
import { useUIStore } from '../../stores/uiStore'
import { Modal, Skeleton } from '../ui'
import { TaskCreateForm } from '../tasks/TaskCreateForm'

export function QuickAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const preferredProjectId = useUIStore((s) => s.quickAddProjectId)
  const setPreferredProjectId = useUIStore((s) => s.setQuickAddProjectId)

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects, enabled: open })

  const routeProjectId = useMemo(() => {
    const m = matchPath('/project/:projectId', location.pathname)
    return m?.params?.projectId ?? null
  }, [location.pathname])

  const defaultProjectId = routeProjectId ?? preferredProjectId ?? undefined

  return (
    <Modal open={open} onClose={onClose} title="Quick add" description="Cmd + K anytime" size="lg">
      {projectsQ.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      ) : projectsQ.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{(projectsQ.error as Error).message}</p>
      ) : (
        <TaskCreateForm
          projects={projectsQ.data ?? []}
          defaults={{ projectId: defaultProjectId }}
          autoFocus={open}
          submitLabel="Create task"
          onCreated={(t) => {
            setPreferredProjectId(t.project_id)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

