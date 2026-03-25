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
      ? `bg-white/[0.025] border-white/[0.06] shadow-lg shadow-black/30`
      : `bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-white/[0.02]
         border-white/[0.12] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_48px_-12px_rgba(0,0,0,0.55)]`

  return (
    <motion.div
      whileHover={
        hoverable
          ? { y: -3, scale: 1.008, transition: { type: 'spring', stiffness: 420, damping: 22 } }
          : undefined
      }
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${surface}
        before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-br before:from-white/[0.07] before:to-transparent before:to-40%
        before:opacity-50 ${className}`}
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
      className={`border-b border-white/[0.06] px-6 py-4 ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }: CardHeadingProps) {
  return (
    <h3
      className={`text-base font-semibold tracking-tight text-gray-100 ${className}`}
      {...props}
    />
  )
}

export function CardDescription({ className = '', ...props }: CardTextProps) {
  return (
    <p className={`mt-1 text-sm text-gray-500 ${className}`} {...props} />
  )
}

export function CardContent({ className = '', ...props }: CardSectionProps) {
  return <div className={`px-6 py-5 ${className}`} {...props} />
}

export function CardFooter({ className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`border-t border-white/[0.06] px-6 py-4 ${className}`}
      {...props}
    />
  )
}
