import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type View = 'list' | 'board' | 'calendar'

interface UIState {
  theme: 'dark' | 'light'
  activeView: View
  sidebarOpen: boolean
  quickAddOpen: boolean
  quickAddProjectId: string | null
  searchOpen: boolean
  toggleTheme: () => void
  setActiveView: (view: View) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setQuickAddOpen: (open: boolean) => void
  setQuickAddProjectId: (projectId: string | null) => void
  setSearchOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeView: 'list',
      sidebarOpen: true,
      quickAddOpen: false,
      quickAddProjectId: null,
      searchOpen: false,
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setQuickAddProjectId: (projectId) => set({ quickAddProjectId: projectId }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    { name: 'todoflow-ui' }
  )
)
