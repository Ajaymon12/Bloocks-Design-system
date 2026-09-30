import { createContext, useContext } from 'react'
import type { ToastProps } from './Toast'

export type ToastOptions = Omit<ToastProps, 'onDismiss'> & {
  /** Milliseconds on screen. Defaults to 5000; a `loading` toast stays until it is updated or
   * dismissed. `Infinity` keeps any toast up. */
  duration?: number
  /** Adds the × badge so the toast can be closed early. */
  isDismissible?: boolean
}

export type ToastApi = {
  /** Shows a toast and returns its id. */
  show: (options: ToastOptions) => string
  /** Changes a toast already on screen, e.g. a `loading` one that finished. Restarts its timer. */
  update: (id: string, options: Partial<ToastOptions>) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
