import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PlainTextCellProps = {
  children: ReactNode
  /** Leading icon slot, e.g. a category icon ("🏦 Bank"). Renders with `currentColor`. */
  icon?: ReactNode
  /** Reveals a pencil icon button on row hover (the row `<tr>` carries `group`, see ui/table.tsx). */
  editable?: boolean
  onEditClick?: () => void
  className?: string
}

export function PlainTextCell({ children, icon, editable = false, onEditClick, className }: PlainTextCellProps) {
  return (
    <div className={cn('flex items-center gap-[var(--space-8)]', className)}>
      {icon && (
        <span className="inline-flex shrink-0 text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {editable && (
        <button
          type="button"
          className="inline-flex items-center justify-center shrink-0 p-[var(--space-2)] border-0 bg-transparent text-muted-foreground cursor-pointer opacity-0 group-hover:opacity-100 hover:text-foreground"
          onClick={onEditClick}
          aria-label="Edit"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  )
}
