import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  subscribeToasts,
  type ToastRecord,
  type ToastType,
} from './toast-api'

export type { ToastPayload, ToastType } from './toast-api'

const DEFAULT_MS = 4200
const WITH_UNDO_MS = 9000

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const resumeMs = useRef<Map<string, number>>(new Map())

  const clearTimer = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
  }, [])

  const remove = useCallback(
    (id: string) => {
      clearTimer(id)
      resumeMs.current.delete(id)
      setToasts((prev) => prev.filter((x) => x.id !== id))
    },
    [clearTimer],
  )

  const schedule = useCallback(
    (id: string, ms: number) => {
      clearTimer(id)
      timers.current.set(
        id,
        setTimeout(() => remove(id), ms),
      )
    },
    [clearTimer, remove],
  )

  const push = useCallback(
    (t: ToastRecord) => {
      setToasts((prev) => [...prev, t])
      const base = t.duration ?? (t.onUndo ? WITH_UNDO_MS : DEFAULT_MS)
      resumeMs.current.set(t.id, base)
      schedule(t.id, base)
    },
    [schedule],
  )

  useEffect(() => {
    subscribeToasts(push)
    const pending = timers.current
    return () => {
      subscribeToasts(null)
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [push])

  const handleEnter = (id: string) => {
    clearTimer(id)
  }

  const handleLeave = (id: string) => {
    const ms = resumeMs.current.get(id) ?? 3200
    schedule(id, Math.min(ms, 4500))
  }

  const typeStyles: Record<ToastType, string> = {
    success: `border-emerald-500/25 bg-emerald-950/55 text-emerald-100
      shadow-[0_0_0_1px_rgba(16,185,129,0.12)_inset]`,
    error: `border-red-500/30 bg-red-950/55 text-red-100
      shadow-[0_0_0_1px_rgba(239,68,68,0.12)_inset]`,
    info: `border-violet-500/25 bg-violet-950/50 text-violet-100
      shadow-[0_0_0_1px_rgba(139,92,246,0.15)_inset]`,
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[200] flex w-full max-w-md flex-col gap-3 p-0 sm:pl-0"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const kind = t.type ?? 'success'
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 24, scale: 0.94, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              onMouseEnter={() => handleEnter(t.id)}
              onMouseLeave={() => handleLeave(t.id)}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm
                shadow-2xl shadow-black/50 backdrop-blur-xl ${typeStyles[kind]}`}
            >
              <div className="min-w-0 flex-1 leading-snug">{t.message}</div>
              {t.onUndo && (
                <button
                  type="button"
                  onClick={() => {
                    t.onUndo?.()
                    remove(t.id)
                  }}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide
                    text-white/95 ring-1 ring-inset ring-white/15 transition-colors
                    hover:bg-white/15"
                >
                  {t.undoLabel ?? 'Undo'}
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
