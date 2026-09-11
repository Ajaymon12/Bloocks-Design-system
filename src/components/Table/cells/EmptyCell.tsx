import type { ReactNode } from 'react'

export type EmptyCellProps = {
  /** Defaults to an em dash. Pass e.g. "Not Mapped" for a labeled placeholder. */
  children?: ReactNode
}

export function EmptyCell({ children = '—' }: EmptyCellProps) {
  return <span className="text-muted-foreground">{children}</span>
}
