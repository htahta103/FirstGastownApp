import type { Task } from '../../types'
import { STATUS_COLUMNS } from '../../lib/constants'

export type BoardColumnId = (typeof STATUS_COLUMNS)[number]

export type ColumnMap = Record<BoardColumnId, Task[]>

export function groupTasksByStatus(tasks: Task[]): ColumnMap {
  const g: ColumnMap = { todo: [], in_progress: [], done: [] }
  for (const t of tasks) {
    if (t.status in g) g[t.status].push(t)
  }
  const byPos = (a: Task, b: Task) => a.position - b.position
  g.todo.sort(byPos)
  g.in_progress.sort(byPos)
  g.done.sort(byPos)
  return g
}

export function columnIdsSignature(cols: ColumnMap): Record<BoardColumnId, string> {
  return {
    todo: cols.todo.map((t) => t.id).join(','),
    in_progress: cols.in_progress.map((t) => t.id).join(','),
    done: cols.done.map((t) => t.id).join(','),
  }
}

export function flattenColumns(cols: ColumnMap): Task[] {
  const out: Task[] = []
  for (const c of STATUS_COLUMNS) {
    for (const t of cols[c]) {
      out.push(t.status === c ? t : { ...t, status: c })
    }
  }
  return out
}

export function findTaskColumn(cols: ColumnMap, id: string): BoardColumnId | null {
  for (const c of STATUS_COLUMNS) {
    if (id === c) return c
    if (cols[c].some((t) => t.id === id)) return c
  }
  return null
}
