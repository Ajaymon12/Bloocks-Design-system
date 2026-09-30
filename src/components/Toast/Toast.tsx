import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Check, CircleAlert, Loader2, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Figma: AIA - Component Library, Toast
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=826-2619
// A dark navy surface with a status glyph, a title, an optional description and an optional action.
// This is the presentational piece; `Toaster` owns stacking, timing and dismissal.
//
// Figma draws the error glyph in a 24px circle in its one-line variant and 21px everywhere else;
// all four statuses use 21px here so they line up when stacked.

export type ToastStatus = 'success' | 'error' | 'warning' | 'loading'

export type ToastAction = {
  label: string
  onClick: () => void
  /** Leading icon, sized 12px, e.g. `<Undo2 size={12} />`. */
  icon?: ReactNode
}

export type ToastProps = {
  status?: ToastStatus
  title: string
  /** A second, smaller line under the title. Widens the toast to its full 344px. */
  description?: string
  /** A small button at the right, e.g. Undo. */
  action?: ToastAction
  /** Shows the round × badge on the top-right corner, and calls this when it is pressed. */
  onDismiss?: () => void
  className?: string
}

const STATUS_CLASSES: Record<ToastStatus, string> = {
  success: 'bg-[var(--palette-green-400)] text-[var(--color-text-on-primary)]',
  error: 'bg-[var(--palette-red-100)] text-[var(--palette-red-600)]',
  warning: 'bg-[var(--palette-amber-500)] text-[var(--palette-blue-950)]',
  loading: 'bg-[var(--color-toast-control-bg)] text-[var(--color-toast-text)]',
}

const STATUS_ICON: Record<ToastStatus, ReactNode> = {
  success: <Check size={12} strokeWidth={3} />,
  error: <CircleAlert size={14} />,
  warning: <TriangleAlert size={12} />,
  loading: <Loader2 size={12} className="animate-spin motion-reduce:animate-none" />,
}

export function Toast({ status = 'success', title, description, action, onDismiss, className }: ToastProps) {
  const isWide = Boolean(description || action)

  return (
    <div
      // Errors interrupt a screen reader; the rest wait their turn.
      role={status === 'error' ? 'alert' : 'status'}
      className={cn(
        'relative box-border flex gap-[var(--space-8)] rounded-[var(--radius-6)] border border-[color:var(--color-toast-border)] bg-[var(--color-toast-bg)] p-[var(--space-12)] text-[color:var(--color-toast-text)] shadow-[var(--shadow-toast)]',
        'font-[family-name:var(--font-family-primary)]',
        isWide ? 'w-[344px] max-w-full items-start' : 'w-fit max-w-[344px] items-center',
        action && 'items-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('inline-flex size-[21px] shrink-0 items-center justify-center rounded-full', STATUS_CLASSES[status])}
      >
        {STATUS_ICON[status]}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-4)]">
        <p className="m-0 text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold tracking-[var(--text-label-2-letter-spacing)] [word-break:break-word]">
          {title}
        </p>
        {description && (
          <p className="m-0 text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-normal tracking-[var(--text-label-3-letter-spacing)] [word-break:break-word]">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-[var(--space-4)] rounded-[var(--radius-6)] border-0 bg-[var(--color-toast-control-bg)] p-[var(--space-4)] font-[family-name:inherit] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-normal tracking-[var(--text-label-3-letter-spacing)] text-[var(--color-text-on-primary)] transition-colors duration-150 hover:bg-[var(--palette-blue-800)]"
        >
          {action.icon && (
            <span aria-hidden="true" className="inline-flex shrink-0">
              {action.icon}
            </span>
          )}
          {action.label}
        </button>
      )}

      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute -top-[7px] -right-[6px] inline-flex size-[15px] cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--color-toast-control-bg)] p-0 text-[var(--color-text-on-primary)] transition-colors duration-150 hover:bg-[var(--palette-blue-800)]"
        >
          <X size={9} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
