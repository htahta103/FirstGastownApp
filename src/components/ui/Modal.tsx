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
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
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
            className={`relative z-[1] w-full ${sizeClasses[size]} overflow-hidden rounded-2xl border border-white/[0.12]
              bg-gradient-to-b from-gray-900/95 to-gray-950/98 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_32px_64px_-16px_rgba(0,0,0,0.75)]
              backdrop-blur-2xl`}
          >
            {!title && !description && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-[2] rounded-xl p-2 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
                aria-label="Close dialog"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {(title || description) && (
              <div className="border-b border-white/[0.08] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {title && (
                      <h2 id={titleId} className="text-lg font-semibold tracking-tight text-gray-50">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id={descId} className="mt-1 text-sm text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-xl p-2 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
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
