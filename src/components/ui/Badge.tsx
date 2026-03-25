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
  default: 'border-white/[0.12] bg-white/[0.06] text-gray-300 ring-white/[0.06]',
  accent:
    'border-violet-400/25 bg-violet-500/15 text-violet-200 ring-violet-400/15',
  success:
    'border-emerald-500/25 bg-emerald-500/12 text-emerald-200 ring-emerald-500/15',
  warning:
    'border-amber-500/30 bg-amber-500/12 text-amber-200 ring-amber-500/15',
  danger: 'border-red-500/30 bg-red-500/12 text-red-200 ring-red-500/15',
  info: 'border-sky-500/25 bg-sky-500/12 text-sky-200 ring-sky-500/15',
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
        shadow-sm shadow-black/20 ring-1 ring-inset backdrop-blur-sm
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
