import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  undoAction?: () => void
}

let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(message: string, type: ToastMessage['type'] = 'success', undoAction?: () => void) {
  addToastFn?.({ message, type, undoAction })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...msg, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  const typeClasses = {
    success: 'border-green-600/30 bg-green-950/80 text-green-300',
    error: 'border-red-600/30 bg-red-950/80 text-red-300',
    info: 'border-blue-600/30 bg-blue-950/80 text-blue-300',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl
              backdrop-blur-sm ${typeClasses[t.type]}`}
          >
            <span>{t.message}</span>
            {t.undoAction && (
              <button
                onClick={() => {
                  t.undoAction?.()
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }}
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                Undo
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
