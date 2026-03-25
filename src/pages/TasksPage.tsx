import { PageTransition } from '../components/layout/PageTransition'

export function TasksPage() {
  return (
    <PageTransition>
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-gray-50">
          Tasks
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Coming soon…</p>
      </div>
    </PageTransition>
  )
}
