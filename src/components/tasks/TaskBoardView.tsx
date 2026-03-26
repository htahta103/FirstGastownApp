import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { updateTaskPosition } from '../../api/client'
import type { Task, TaskListResult } from '../../types'
import { STATUS_COLUMNS, STATUS_LABELS } from '../../lib/constants'
import { Button, Skeleton, toast } from '../ui'
import { TasksEmptyIllustration } from './TasksEmptyIllustration'
import {
  type BoardColumnId,
  type ColumnMap,
  columnIdsSignature,
  findTaskColumn,
  flattenColumns,
  groupTasksByStatus,
} from './taskUtils'

function persistChangedColumns(prev: ColumnMap, next: ColumnMap): Promise<void> {
  const sigPrev = columnIdsSignature(prev)
  const sigNext = columnIdsSignature(next)
  const changed: BoardColumnId[] = []
  for (const c of STATUS_COLUMNS) {
    if (sigPrev[c] !== sigNext[c]) changed.push(c)
  }
  if (changed.length === 0) return Promise.resolve()
  const ops: Promise<Task>[] = []
  for (const c of changed) {
    next[c].forEach((t, i) => {
      ops.push(
        updateTaskPosition(t.id, {
          position: (i + 1) * 1000,
          status: c,
        }),
      )
    })
  }
  return Promise.all(ops).then(() => undefined)
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <motion.div
        layout
        initial={false}
        animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.92 : 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32 }}
        {...listeners}
        {...attributes}
        className="cursor-grab rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 shadow-sm active:cursor-grabbing"
      >
        <p className="text-sm font-medium text-gray-100">{task.title}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-600">
          {task.priority} · {task.due_date ?? 'No due'}
        </p>
      </motion.div>
    </div>
  )
}

function ColumnShell({
  colId,
  title,
  tasks,
}: {
  colId: BoardColumnId
  title: string
  tasks: Task[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colId })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[min(50vh,28rem)] flex-col rounded-2xl border border-white/[0.08] bg-black/20 p-3 transition-colors ${
        isOver ? 'border-violet-500/35 bg-violet-500/5' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
        <span className="text-[10px] tabular-nums text-gray-600">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} />
          ))}
          {tasks.length === 0 && (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-xs text-gray-600">
              Drop tasks here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function TaskBoardView({
  tasks,
  isLoading,
  isError,
  error,
  onRetry,
  queryKey,
}: {
  tasks: Task[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  queryKey: readonly unknown[]
}) {
  const qc = useQueryClient()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const syncMutation = useMutation({
    mutationFn: ({ prev, next }: { prev: ColumnMap; next: ColumnMap }) => persistChangedColumns(prev, next),
  })

  const columns = groupTasksByStatus(tasks)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string
    const overId = over.id as string

    const base = groupTasksByStatus(tasks)
    const activeCol = findTaskColumn(base, activeId)
    if (!activeCol) return

    let overCol = findTaskColumn(base, overId)
    if (!overCol && STATUS_COLUMNS.includes(overId as BoardColumnId)) {
      overCol = overId as BoardColumnId
    }
    if (!overCol) return

    let next: ColumnMap

    if (activeCol === overCol) {
      const list = [...base[activeCol]]
      const oldIdx = list.findIndex((t) => t.id === activeId)
      const newIdx = list.findIndex((t) => t.id === overId)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return
      next = { ...base, [activeCol]: arrayMove(list, oldIdx, newIdx) }
    } else {
      const source = [...base[activeCol]]
      const dest = [...base[overCol]]
      const from = source.findIndex((t) => t.id === activeId)
      if (from < 0) return
      const [moved] = source.splice(from, 1)
      const updated: Task = { ...moved, status: overCol }
      const overIsColumn = STATUS_COLUMNS.includes(overId as BoardColumnId)
      if (overIsColumn) {
        dest.push(updated)
      } else {
        const overIdx = dest.findIndex((t) => t.id === overId)
        if (overIdx >= 0) dest.splice(overIdx, 0, updated)
        else dest.push(updated)
      }
      next = { ...base, [activeCol]: source, [overCol]: dest }
    }

    const prev = base
    qc.setQueryData(queryKey, (old: TaskListResult | undefined) => {
      const flat = flattenColumns(next)
      return {
        tasks: flat,
        total: old?.total ?? flat.length,
      }
    })

    syncMutation.mutate(
      { prev, next },
      {
        onError: (e: Error) => {
          toast({ message: e.message, type: 'error' })
          void qc.invalidateQueries({ queryKey: [...queryKey] })
          // Calendar may be affected by status/priority filters, so refresh it too.
          void qc.invalidateQueries({ queryKey: ['tasks', 'calendar'] })
        },
        onSettled: () => {
          void qc.invalidateQueries({ queryKey: ['dashboard'] })
          // Calendar visibility depends on task fields and current filter range.
          void qc.invalidateQueries({ queryKey: ['tasks', 'calendar'] })
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
        <p className="text-sm text-red-300">{error?.message ?? 'Failed to load tasks'}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <TasksEmptyIllustration className="mx-auto mb-6 w-48 text-violet-500/30" />
        <h2 className="text-lg font-semibold text-gray-200">No tasks for this board</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Widen filters or create tasks from the dashboard.
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUS_COLUMNS.map((colId) => (
          <ColumnShell
            key={colId}
            colId={colId}
            title={STATUS_LABELS[colId]}
            tasks={columns[colId]}
          />
        ))}
      </div>
    </DndContext>
  )
}
