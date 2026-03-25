import type { HTMLAttributes } from 'react'
import { motion } from 'framer-motion'

type CardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
> & {
  /** Subtle lift + scale on hover */
  hoverable?: boolean
  /** Softer, more “frosted” panel */
  variant?: 'default' | 'subtle'
}

export function Card({
  hoverable = false,
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const surface =
    variant === 'subtle'
      ? `border-slate-200/70 bg-white/55 shadow-md shadow-slate-900/[0.04] dark:border-white/[0.06] dark:bg-white/[0.025] dark:shadow-lg dark:shadow-black/30`
      : `border-slate-200/80 bg-gradient-to-br from-white/90 via-white/70 to-slate-50/40 shadow-[0_0_0_1px_rgba(15,23,42,0.04)_inset,0_20px_40px_-12px_rgba(15,23,42,0.12)]
         dark:from-white/[0.09] dark:via-white/[0.04] dark:to-white/[0.02] dark:border-white/[0.12]
         dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_48px_-12px_rgba(0,0,0,0.55)]`

  return (
    <motion.div
      whileHover={
        hoverable
          ? { y: -3, scale: 1.008, transition: { type: 'spring', stiffness: 420, damping: 22 } }
          : undefined
      }
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${surface}
        before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-br before:from-white/40 before:to-transparent before:to-40%
        before:opacity-80 dark:before:from-white/[0.07] dark:before:opacity-50 ${className}`}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  )
}

type CardSectionProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

type CardHeadingProps = Omit<
  HTMLAttributes<HTMLHeadingElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

type CardTextProps = Omit<
  HTMLAttributes<HTMLParagraphElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>

export function CardHeader({ className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`border-b border-slate-200/70 px-6 py-4 dark:border-white/[0.06] ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }: CardHeadingProps) {
  return (
    <h3
      className={`text-base font-semibold tracking-tight text-slate-900 dark:text-gray-100 ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ className = '', ...props }: CardTextProps) {
  return (
    <p className={`mt-1 text-sm text-slate-600 dark:text-gray-500 ${className}`} {...props} />
  )
}

export function CardContent({ className = '', ...props }: CardSectionProps) {
  return <div className={`px-6 py-5 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`border-t border-slate-200/70 px-6 py-4 dark:border-white/[0.06] ${className}`}
      {...props}
    />
  )
}
