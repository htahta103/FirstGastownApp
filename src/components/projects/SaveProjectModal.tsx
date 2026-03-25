import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createProject, updateProject } from '../../api/client'
import type { Project, ProjectInput } from '../../types'
import { displayProjectIcon } from '../../lib/projectUi'
import { Modal, toast } from '../ui'
import { ProjectForm } from './ProjectForm'

export function SaveProjectModal({
  open,
  onClose,
  project,
}: {
  open: boolean
  onClose: () => void
  /** When set, edit mode */
  project?: Project | null
}) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isEdit = Boolean(project)

  const mutation = useMutation({
    mutationFn: (input: ProjectInput) =>
      isEdit && project ? updateProject(project.id, input) : createProject(input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['tasks'] })
      if (isEdit && project) {
        void qc.invalidateQueries({ queryKey: ['project', project.id] })
      }
      toast(isEdit ? 'Project updated' : 'Project created', 'success')
      onClose()
      if (!isEdit) navigate(`/project/${data.id}`)
    },
    onError: (e: Error) => {
      toast({ message: e.message, type: 'error' })
    },
  })

  const defaults = project
    ? {
        name: project.name,
        icon: displayProjectIcon(project.icon),
        color: project.color || '#3B82F6',
      }
    : {
        name: '',
        icon: '📁',
        color: '#8B5CF6',
      }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      description={
        isEdit ? 'Update how this project appears across TodoFlow.' : 'Create a space for related tasks.'
      }
      size="md"
    >
      {open && (
        <ProjectForm
          key={project?.id ?? 'new'}
          defaultValues={defaults}
          onSubmit={(input) => mutation.mutate(input)}
          onCancel={onClose}
          isPending={mutation.isPending}
          submitLabel={isEdit ? 'Save changes' : 'Create project'}
        />
      )}
    </Modal>
  )
}
