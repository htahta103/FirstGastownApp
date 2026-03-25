import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type View = 'list' | 'board' | 'calendar'

interface UIState {
  theme: 'dark' | 'light'
  activeView: View
  sidebarOpen: boolean
  quickAddOpen: boolean
  searchOpen: boolean
  toggleTheme: () => void
  setActiveView: (view: View) => void
  toggleSidebar: () => void
  setQuickAddOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeView: 'list',
      sidebarOpen: true,
      quickAddOpen: false,
      searchOpen: false,
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setQuickAddOpen: (open) => set({ quickAddOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    { name: 'todoflow-ui' }
  )
)
