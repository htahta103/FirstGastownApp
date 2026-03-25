import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ProjectSidebarList } from './ProjectSidebarList'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-white/[0.08] text-violet-200'
      : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
  }`

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-gray-900/40 p-4 backdrop-blur-md">
        <h1 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-xl font-bold text-transparent">
          TodoFlow
        </h1>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={navClass}>
            Tasks
          </NavLink>
        </nav>
        <ProjectSidebarList />
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
