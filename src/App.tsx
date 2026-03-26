import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { SearchModal } from './components/tasks/SearchModal'
import { QuickAddModal } from './components/quick-add/QuickAddModal'
import { useUIStore } from './stores/uiStore'
import { ensureUser } from './api/client'
import { Layout } from './components/layout/Layout'
import { ToastContainer } from './components/ui'
import { DashboardPage } from './pages/DashboardPage'
import { TasksPage } from './pages/TasksPage'
import { ProjectPage } from './pages/ProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function AppContent() {
  const theme = useUIStore((s) => s.theme)
  const searchOpen = useUIStore((s) => s.searchOpen)
  const setSearchOpen = useUIStore((s) => s.setSearchOpen)
  const quickAddOpen = useUIStore((s) => s.quickAddOpen)
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    ensureUser().catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName?.toLowerCase()
      const isTypingTarget =
        tag === 'input' || tag === 'textarea' || Boolean((t as HTMLElement | null)?.isContentEditable)
      if (isTypingTarget) return

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        const s = useUIStore.getState()
        s.setSearchOpen(!s.searchOpen)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const s = useUIStore.getState()
        s.setQuickAddOpen(!s.quickAddOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Layout>
      <ToastContainer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:projectId" element={<ProjectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
