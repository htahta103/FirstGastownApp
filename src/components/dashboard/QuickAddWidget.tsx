import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask, deleteTask } from '../../api/client'
import type { Project } from '../../types'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  toast,
} from '../ui'

export function QuickAddWidget({ projects }: { projects: Project[] }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')

  const resolvedProjectId = useMemo(() => {
    if (projects.length === 0) return ''
    if (projectId && projects.some((p) => p.id === projectId)) return projectId
    return projects[0].id
  }, [projects, projectId])

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
            .catch((err: Error) => {
              toast({ message: err.message, type: 'error' })
            })
        },
      })
    },
    onError: (e: Error) => {
      toast({ message: e.message, type: 'error' })
    },
  })

  const options = projects.map((p) => ({ value: p.id, label: p.name }))
  const canSubmit = title.trim().length > 0 && resolvedProjectId.length > 0 && !mutation.isPending

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
          <>
            <Input
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
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={!canSubmit}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Add task
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
