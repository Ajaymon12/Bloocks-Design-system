import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from './Toast'
import { ToastContext } from './ToastContext'
import type { ToastOptions } from './ToastContext'

// Stacking, auto-dismiss and enter/exit for `Toast`. Wrap the app in `ToastProvider` once, then call
// `useToast()` anywhere below it. Hovering or focusing a toast holds its timer so it can be read or
// its action reached.

type ToastEntry = ToastOptions & { id: string; isClosing: boolean }

const DEFAULT_DURATION = 5000
const EXIT_MS = 160

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.map((entry) => (entry.id === id ? { ...entry, isClosing: true } : entry)))
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    const id = `toast-${(nextId += 1)}`
    setToasts((current) => [...current, { ...options, id, isClosing: false }])
    return id
  }, [])

  const update = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((current) => current.map((entry) => (entry.id === id ? { ...entry, ...options, isClosing: false } : entry)))
  }, [])

  const api = useMemo(() => ({ show, update, dismiss }), [show, update, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--space-24)] z-[60] flex flex-col items-center gap-[var(--space-8)] px-[var(--space-16)]">
        {toasts.map((entry) => (
          <ToastItem key={entry.id} entry={entry} onDismiss={dismiss} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({
  entry,
  onDismiss,
  onRemove,
}: {
  entry: ToastEntry
  onDismiss: (id: string) => void
  onRemove: (id: string) => void
}) {
  const { id, isClosing, duration, isDismissible, ...toastProps } = entry
  const [isHeld, setIsHeld] = useState(false)
  const ms = duration ?? (toastProps.status === 'loading' ? Infinity : DEFAULT_DURATION)

  // Re-keyed on the content so an `update` (loading → success) starts a fresh countdown.
  const contentKey = `${toastProps.status}|${toastProps.title}|${toastProps.description}|${ms}`
  useEffect(() => {
    if (isClosing || isHeld || !Number.isFinite(ms)) return
    const timer = window.setTimeout(() => onDismiss(id), ms)
    return () => window.clearTimeout(timer)
  }, [id, isClosing, isHeld, ms, contentKey, onDismiss])

  // Removed on a timer rather than on `animationend`, which never fires when the animation is
  // turned off.
  useEffect(() => {
    if (!isClosing) return
    const timer = window.setTimeout(() => onRemove(id), EXIT_MS + 40)
    return () => window.clearTimeout(timer)
  }, [id, isClosing, onRemove])

  return (
    <div
      className="pointer-events-auto max-w-full data-[closing=false]:animate-[toast-in_200ms_cubic-bezier(0.32,0.72,0,1)] data-[closing=true]:animate-[toast-out_160ms_ease-in_forwards]"
      data-closing={isClosing}
      onMouseEnter={() => setIsHeld(true)}
      onMouseLeave={() => setIsHeld(false)}
      onFocus={() => setIsHeld(true)}
      onBlur={() => setIsHeld(false)}
    >
      <Toast
        {...toastProps}
        action={
          toastProps.action && {
            ...toastProps.action,
            // Acting on a toast closes it — Undo has done its job once pressed.
            onClick: () => {
              toastProps.action?.onClick()
              onDismiss(id)
            },
          }
        }
        onDismiss={isDismissible ? () => onDismiss(id) : undefined}
      />
    </div>
  )
}
