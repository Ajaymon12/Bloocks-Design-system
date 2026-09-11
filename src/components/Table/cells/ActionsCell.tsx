import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ActionsCellProps = {
  /** Caller-supplied action buttons, e.g. an icon-only `<Button leadingIcon={<MoreHorizontal />} />`.
   * No dropdown-menu behavior yet — that needs a Popover/DropdownMenu primitive this phase
   * deliberately doesn't build. */
  children: ReactNode
  className?: string
}

export function ActionsCell({ children, className }: ActionsCellProps) {
  return <div className={cn('flex items-center justify-end gap-[var(--space-4)]', className)}>{children}</div>
}
