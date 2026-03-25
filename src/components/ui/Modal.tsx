import { useEffect, useId, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: ModalProps) {
  const id = useId()
  const titleId = title ? `${id}-title` : undefined
  const descId = description ? `${id}-desc` : undefined

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md dark:bg-black/70"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.94, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`relative z-[1] w-full ${sizeClasses[size]} overflow-hidden rounded-2xl border border-slate-200/90
              bg-gradient-to-b from-white/98 to-slate-50/98 shadow-[0_0_0_1px_rgba(15,23,42,0.04)_inset,0_32px_64px_-16px_rgba(15,23,42,0.15)]
              backdrop-blur-2xl dark:border-white/[0.12] dark:from-gray-900/95 dark:to-gray-950/98
              dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_32px_64px_-16px_rgba(0,0,0,0.75)]`}
          >
            {!title && !description && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-[2] rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                aria-label="Close dialog"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {(title || description) && (
              <div className="border-b border-slate-200/80 px-6 py-5 dark:border-white/[0.08]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {title && (
                      <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-50">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descId} className="mt-1 text-sm text-slate-600 dark:text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                  >
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <div className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
