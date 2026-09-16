import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_JUSTIFY } from './cellVariants'

export type ActionsCellProps = {
  /** Caller-supplied action buttons — one for a single icon action (e.g. a "⋮" menu trigger) or
   * several side by side (e.g. an upload icon plus a "⋮" menu — see the `ActionIcons` story on
   * `Components/Table`). No dropdown-menu behavior built in — that's each button's own job. */
  children: ReactNode
  align?: CellAlign
  /** Blocks pointer interaction with every action in the cell (CSS-only — the buttons themselves
   * aren't individually disabled, so give each its own `isDisabled`/`disabled` too if it needs to
   * stay out of the tab order). */
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

// Right-aligned by default, matching Figma's action-column cells — a column using ActionsCell
// should still declare `meta: { align: 'end' }` so its header agrees.
export function ActionsCell({ children, align, isDisabled, tooltip, className }: ActionsCellProps) {
  const resolved = useCellProps({ align }, { align: 'end' })
  return (
    <div
      title={tooltip}
      className={cn('flex items-center gap-[var(--space-4)]', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}
    >
      {children}
    </div>
  )
}
