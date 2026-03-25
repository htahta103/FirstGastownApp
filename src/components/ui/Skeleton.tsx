import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'

type SkeletonVariant = 'rect' | 'circle' | 'line'

type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  variant?: SkeletonVariant
  /** Disable shimmer for reduced motion preference handled by caller, or static tests */
  shimmer?: boolean
}

const variantShape: Record<SkeletonVariant, string> = {
  rect: 'rounded-xl',
  circle: 'rounded-full',
  line: 'rounded-md',
}

export function Skeleton({
  variant = 'rect',
  className = '',
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/70 dark:bg-white/[0.06] ${variantShape[variant]} ${shimmer ? 'ui-skeleton-shimmer' : ''} ${className}`}
      {...props}
    />
  )
}

/** Staggered list row placeholder */
export function TaskSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/60 p-4 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.03]"
    >
      <Skeleton variant="circle" className="size-10 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <Skeleton variant="line" className="h-3.5 w-[72%]" />
        <Skeleton variant="line" className="h-3 w-[44%]" />
      </div>
      <Skeleton variant="rect" className="h-8 w-20 shrink-0 rounded-lg" />
    </motion.div>
  )
}

/** Block placeholder for cards / panels */
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/60 p-6 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.03]">
      <Skeleton variant="line" className="h-5 w-2/5" />
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton variant="line" className="h-9 flex-1" />
        <Skeleton variant="line" className="h-9 flex-1" />
      </div>
    </div>
  )
}
