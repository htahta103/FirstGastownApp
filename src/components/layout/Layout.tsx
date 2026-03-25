import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'
import { ProjectSidebarList } from './ProjectSidebarList'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={`rounded-xl border border-slate-200/90 bg-white/80 p-2.5 text-slate-600 shadow-sm backdrop-blur-md transition-colors
        hover:bg-white hover:text-violet-700
        dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-amber-200/90 dark:shadow-none dark:hover:bg-white/[0.1] dark:hover:text-amber-100
        ${className}`}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-violet-100 text-violet-900 dark:bg-white/[0.08] dark:text-violet-200'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-500 dark:hover:bg-white/[0.04] dark:hover:text-gray-300'
  }`

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  useEffect(() => {
    if (!isLg) setSidebarOpen(false)
  }, [location.pathname, isLg, setSidebarOpen])

  const showDrawer = !isLg && sidebarOpen
  const drawerX = !isLg ? (sidebarOpen ? 0 : '-100%') : 0

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 dark:bg-gray-950">
      <header
        className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/70 px-3 py-2.5 backdrop-blur-xl dark:border-white/[0.06] dark:bg-gray-900/35 lg:hidden"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => toggleSidebar()}
          className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 truncate bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-lg font-bold text-transparent dark:from-violet-400 dark:to-fuchsia-400">
          TodoFlow
        </h1>
        <ThemeToggle />
      </header>

      <div className="relative flex min-h-0 flex-1">
        <AnimatePresence>
          {showDrawer && (
            <motion.button
              type="button"
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm dark:bg-black/55 lg:hidden"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          initial={false}
          animate={isLg ? { x: 0 } : { x: drawerX }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          className="fixed inset-y-0 left-0 z-40 flex w-[min(17rem,88vw)] flex-col border-r border-slate-200/80 bg-white/75 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/[0.06] dark:bg-gray-900/40 dark:shadow-none lg:static lg:z-0 lg:w-64 lg:shadow-none"
          style={{
            paddingTop: isLg ? undefined : 'max(1rem, env(safe-area-inset-top))',
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-xl font-bold text-transparent dark:from-violet-400 dark:to-fuchsia-400">
              TodoFlow
            </h1>
            <ThemeToggle className="hidden lg:inline-flex" />
          </div>
          <nav className="mt-2 flex flex-col gap-1 lg:mt-6">
            <NavLink to="/" end className={navClass} onClick={() => !isLg && setSidebarOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" className={navClass} onClick={() => !isLg && setSidebarOpen(false)}>
              Tasks
            </NavLink>
          </nav>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ProjectSidebarList onNavigate={() => !isLg && setSidebarOpen(false)} />
          </div>
        </motion.aside>

        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
