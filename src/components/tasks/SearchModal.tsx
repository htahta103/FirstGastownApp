import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchTasks } from '../../api/client'
import type { Task } from '../../types'
import { Input, Modal, Skeleton } from '../ui'

function SearchModalBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) return
    let cancelled = false
    const id = window.setTimeout(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
      searchTasks(q, 25)
        .then((data) => {
          if (!cancelled) setResults(data)
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [query])

  const trimmed = query.trim()
  const displayResults = trimmed ? results : []
  const displayLoading = Boolean(trimmed && loading)
  const displayError = trimmed ? error : null

  const pick = (task: Task) => {
    navigate(`/tasks?task=${encodeURIComponent(task.id)}`)
    onClose()
  }

  return (
    <div className="space-y-4">
      <Input
        ref={inputRef}
        label="Query"
        placeholder="Search by title or description…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && displayResults[0]) pick(displayResults[0])
        }}
      />
      {displayLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      )}
      {displayError && <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>}
      {!displayLoading && trimmed && displayResults.length === 0 && !displayError && (
        <p className="text-sm text-slate-600 dark:text-gray-500">No matches.</p>
      )}
      <ul className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto pr-1">
        {displayResults.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => pick(t)}
              className="flex w-full flex-col rounded-xl border border-slate-200/90 bg-white/70 px-4 py-3 text-left transition-colors hover:border-violet-300/80 hover:bg-violet-50/50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
            >
              <span className="font-medium text-slate-900 dark:text-gray-100">{t.title}</span>
              <span className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-gray-500">
                {t.description || 'No description'}
              </span>
              <span className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-gray-500">
                <span className="capitalize">{t.status.replace('_', ' ')}</span>
                <span>·</span>
                <span className="capitalize">{t.priority}</span>
                {t.due_date && (
                  <>
                    <span>·</span>
                    <span className="font-mono">Due {t.due_date}</span>
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Search tasks" description="Cmd + / anytime" size="lg">
      {open ? <SearchModalBody onClose={onClose} /> : null}
    </Modal>
  )
}
