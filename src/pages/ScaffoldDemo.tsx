import { useDraggable, useDroppable, DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'

function DraggableChip() {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'scaffold-chip',
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow active:cursor-grabbing dark:bg-violet-500 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      @dnd-kit
    </button>
  )
}

function DropZone({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'scaffold-drop' })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[5.5rem] items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-900/50 p-4 transition-colors dark:border-gray-500 dark:bg-gray-900/80 ${
        isOver ? 'border-emerald-500 bg-emerald-950/30' : ''
      }`}
    >
      {children}
    </div>
  )
}

export function ScaffoldDemo() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const [dropped, setDropped] = useState(false)

  const { data: health, isFetching } = useQuery({
    queryKey: ['scaffold-health'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 150))
      return { status: 'ok' as const }
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over?.id === 'scaffold-drop') setDropped(true)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">
            Scaffold
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            React 18 · Vite · Tailwind · Router v6 · Query · Zustand · Motion ·
            dnd-kit · date-fns
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-700 dark:border-gray-500"
          >
            Theme: {theme}
          </button>
          <Link
            to="/about"
            className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-violet-300 hover:bg-gray-800"
          >
            About route →
          </Link>
        </div>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-6 dark:border-gray-700"
      >
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Libraries
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">date-fns</dt>
            <dd className="font-mono text-gray-200">
              {format(new Date(), 'PPpp')}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">TanStack Query</dt>
            <dd className="font-mono text-gray-200">
              {isFetching ? 'loading…' : health?.status ?? '—'}
            </dd>
          </div>
        </dl>
      </motion.section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Drag & drop
        </h2>
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 items-center">
              <DraggableChip />
            </div>
            <div className="flex-1">
              <DropZone>
                {dropped ? (
                  <span className="text-sm text-emerald-400">Dropped ✓</span>
                ) : (
                  <span className="text-sm text-gray-500">Drop chip here</span>
                )}
              </DropZone>
            </div>
          </div>
        </DndContext>
      </section>
    </div>
  )
}
