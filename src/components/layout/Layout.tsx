import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900/50 border-r border-gray-800 p-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">TodoFlow</h1>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
