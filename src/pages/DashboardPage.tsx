import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboard, listProjects } from '../api/client'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { ProjectProgressRings } from '../components/dashboard/ProjectProgressRings'
import { QuickAddWidget } from '../components/dashboard/QuickAddWidget'
import { StatCards } from '../components/dashboard/StatCards'
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines'
import { PageTransition } from '../components/layout/PageTransition'
import { Button, Skeleton, SkeletonCard } from '../components/ui'

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  })

  const progressWithColors = useMemo(() => {
    const dash = dashboardQuery.data
    const projects = projectsQuery.data ?? []
    if (!dash) return []
    const colorById = new Map(projects.map((p) => [p.id, p.color]))
    return dash.project_progress.map((pp) => ({
      ...pp,
      color: colorById.get(pp.project_id) || '#a78bfa',
    }))
  }, [dashboardQuery.data, projectsQuery.data])

  if (dashboardQuery.isLoading) {
    return (
      <PageTransition>
      <div className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <SkeletonCard />
      </div>
      </PageTransition>
    )
  }

  if (dashboardQuery.isError) {
    const err = dashboardQuery.error as Error
    return (
      <PageTransition>
      <div className="flex flex-col items-start gap-4 p-8">
        <p className="text-sm text-red-600 dark:text-red-400">{err.message}</p>
        <Button type="button" variant="secondary" onClick={() => void dashboardQuery.refetch()}>
          Retry
        </Button>
      </div>
      </PageTransition>
    )
  }

  const d = dashboardQuery.data!

  return (
    <PageTransition>
    <div className="space-y-8 p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-gray-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-500">
          Overview of your workload, deadlines, and recent changes.
        </p>
      </header>

      <StatCards
        stats={{
          total_tasks: d.total_tasks,
          completed_today: d.completed_today,
          overdue_count: d.overdue_count,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickAddWidget projects={projectsQuery.data ?? []} />
        </div>
        <div className="lg:col-span-2">
          <ProjectProgressRings rows={progressWithColors} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed items={d.recent_activity} />
        <UpcomingDeadlines tasks={d.upcoming_deadlines} />
      </div>
    </div>
    </PageTransition>
  )
}
