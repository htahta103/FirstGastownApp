import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  /** Emoji string, inline SVG, or icon component */
  icon?: ReactNode
  action?: { label: string; onClick: () => void }
}

const defaultIcon = (
  <svg className="size-12 text-violet-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.25}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
)

export function EmptyState({
  title,
  description,
  icon = defaultIcon,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="relative mb-6 flex size-24 items-center justify-center">
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent blur-xl"
          aria-hidden
        />
        <div
          className="relative flex size-20 items-center justify-center rounded-2xl border border-slate-200/90
            bg-white/80 shadow-lg shadow-violet-500/10 backdrop-blur-md dark:border-white/[0.1] dark:bg-white/[0.04]"
        >
          {typeof icon === 'string' ? (
            <span className="text-4xl" role="img" aria-hidden>
              {icon}
            </span>
          ) : (
            icon
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-gray-500">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="md" className="mt-8" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
