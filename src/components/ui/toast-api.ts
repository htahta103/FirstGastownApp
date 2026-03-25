import type { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export type ToastPayload = {
  message: ReactNode
  type?: ToastType
  /** Shown when `onUndo` is set. */
  undoLabel?: string
  onUndo?: () => void
  /** ms; when undo is present, default is longer in the container */
  duration?: number
}

export type ToastRecord = ToastPayload & { id: string }

type Subscriber = (toast: ToastRecord) => void

let subscriber: Subscriber | null = null

export function subscribeToasts(fn: Subscriber | null) {
  subscriber = fn
}

function normalizePayload(
  messageOrPayload: ReactNode | ToastPayload,
  type?: ToastType,
  onUndo?: () => void,
): ToastPayload {
  if (
    messageOrPayload !== null &&
    typeof messageOrPayload === 'object' &&
    'message' in messageOrPayload
  ) {
    return messageOrPayload as ToastPayload
  }
  return {
    message: messageOrPayload as ReactNode,
    type: type ?? 'success',
    onUndo,
  }
}

export function toast(message: ReactNode, type?: ToastType, onUndo?: () => void): void
export function toast(payload: ToastPayload): void
export function toast(
  messageOrPayload: ReactNode | ToastPayload,
  type?: ToastType,
  onUndo?: () => void,
): void {
  const p = normalizePayload(messageOrPayload, type, onUndo)
  const id = crypto.randomUUID()
  subscriber?.({ ...p, id })
}
