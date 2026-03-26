import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask } from '../../api/client'
import type { Project, Task } from '../../types'
import { Button, Input, Select, toast } from '../ui'

type Defaults = {
  projectId?: string
  title?: string
}

export function TaskCreateForm({
  projects,
  defaults,
  autoFocus = false,
  submitLabel = 'Add task',
  onCreated,
}: {
  projects: Project[]
  defaults?: Defaults
  autoFocus?: boolean
  submitLabel?: string
  onCreated?: (task: Task) => void
}) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(defaults?.title ?? '')
  const [projectId, setProjectId] = useState(defaults?.projectId ?? '')

  const resolvedProjectId = useMemo(() => {
    if (projects.length === 0) return ''
    if (projectId && projects.some((p) => p.id === projectId)) return projectId
    if (defaults?.projectId && projects.some((p) => p.id === defaults.projectId)) return defaults.projectId
    return projects[0].id
  }, [projects, projectId, defaults?.projectId])

  useEffect(() => {
    if (!autoFocus) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [autoFocus])

  const mutation = useMutation({
    mutationFn: () =>
      createTask({
        project_id: resolvedProjectId,
        title: title.trim(),
        status: 'todo',
        priority: 'medium',
      }),
    onSuccess: (task) => {
      setTitle('')
      onCreated?.(task)

      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['projects'] })
      void qc.invalidateQueries({ queryKey: ['tasks'] })

      toast({
        message: 'Task created',
        type: 'success',
        undoLabel: 'Undo',
        onUndo: () => {
          deleteTask(task.id)
            .then(() => {
              void qc.invalidateQueries({ queryKey: ['dashboard'] })
              void qc.invalidateQueries({ queryKey: ['projects'] })
              void qc.invalidateQueries({ queryKey: ['tasks'] })
            })
            .catch((err: Error) => toast({ message: err.message, type: 'error' }))
        },
      })
    },
    onError: (e: Error) => toast({ message: e.message, type: 'error' }),
  })

  const options = projects.map((p) => ({ value: p.id, label: p.name }))
  const canSubmit = title.trim().length > 0 && resolvedProjectId.length > 0 && !mutation.isPending

  return (
    <div className="space-y-4">
      <Input
        ref={inputRef}
        label="Title"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSubmit) mutation.mutate()
        }}
      />
      <Select
        label="Project"
        options={options}
        value={resolvedProjectId}
        onChange={(e) => setProjectId(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          className="w-full sm:w-auto"
          disabled={!canSubmit}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

