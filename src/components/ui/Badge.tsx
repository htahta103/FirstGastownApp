import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

type BadgeSize = 'sm' | 'md'

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'border-slate-200/90 bg-slate-100 text-slate-700 ring-slate-200/60 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/[0.06]',
  accent:
    'border-violet-200/90 bg-violet-100 text-violet-800 ring-violet-200/70 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/15',
  success:
    'border-emerald-200/90 bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200 dark:ring-emerald-500/15',
  warning:
    'border-amber-200/90 bg-amber-50 text-amber-900 ring-amber-200/70 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200 dark:ring-amber-500/15',
  danger:
    'border-red-200/90 bg-red-50 text-red-800 ring-red-200/70 dark:border-red-500/30 dark:bg-red-500/12 dark:text-red-200 dark:ring-red-500/15',
  info: 'border-sky-200/90 bg-sky-50 text-sky-900 ring-sky-200/70 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-200 dark:ring-sky-500/15',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider',
  md: 'px-2.5 py-0.5 text-xs font-medium',
}

/** Small status / label chip with premium glass styling */
export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium
        shadow-sm shadow-slate-900/5 ring-1 ring-inset backdrop-blur-sm dark:shadow-black/20
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
