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
  hoverable?: boolean
}

export function Card({ hoverable = false, className = '', children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2, scale: 1.01 } : undefined}
      className={`rounded-xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm
        shadow-lg shadow-black/20 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
