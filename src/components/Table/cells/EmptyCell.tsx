import type { ReactNode } from 'react'
import { Cell } from './Cell'

export type EmptyCellProps = {
  /** Defaults to an em dash. Pass e.g. "Not Mapped" for a labeled placeholder. */
  children?: ReactNode
  className?: string
}

/** @deprecated Prefer `empty` on whichever cell would otherwise hold the value — e.g.
 * `<PlainTextCell empty="Not Mapped">{value}</PlainTextCell>` — or `meta: { empty: '…' }` on the
 * column, so the caller doesn't need to branch on nullish data at all. Use `<Cell empty="…" />`
 * directly when there's no other cell type to attach it to. Kept for existing call sites. */
export function EmptyCell({ children = '—', className }: EmptyCellProps) {
  return <Cell empty={children} className={className} />
}
