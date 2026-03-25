export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-800/50 ${className}`}
    />
  )
}

export function TaskSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}
