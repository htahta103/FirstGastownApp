import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { deleteProject } from '../../api/client'
import type { Project } from '../../types'
import { Button, Modal, toast } from '../ui'

export function DeleteProjectModal({
  project,
  onClose,
}: {
  project: Project | null
  onClose: () => void
}) {
  const open = Boolean(project)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const mutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['tasks'] })
      void qc.removeQueries({ queryKey: ['project', id] })
      toast('Project deleted', 'success')
      onClose()
      if (location.pathname.startsWith(`/project/${id}`)) {
        navigate('/projects', { replace: true })
      }
    },
    onError: (e: Error) => {
      toast({ message: e.message, type: 'error' })
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete project"
      description="This removes the project and all of its tasks, subtasks, and tag links. This cannot be undone."
      size="sm"
    >
      {project && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400">
            Delete <span className="font-medium text-gray-200">{project.name}</span>?
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate(project.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
