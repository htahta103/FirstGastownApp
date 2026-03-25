import { useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'

export function ThemeSync() {
  const theme = useUIStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}
