import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { CellAlign, CellSize, CellTone, CellTruncate } from './cellVariants'

/** Column-level defaults, published by `Table` (Table.tsx) around each cell's rendered output —
 * read from `ColumnMeta.align`/`size`/`truncate`/`empty`. Every field optional: `undefined` means
 * "this column didn't say", so a cell's own component default can still apply. */
export type CellDefaults = {
  align?: CellAlign
  size?: CellSize
  truncate?: CellTruncate
  empty?: ReactNode
}

// Lives beside the other cell primitives, not in Table.tsx — a cell file only ever imports from
// its own directory; Table.tsx is the one that imports from cells/, never the reverse.
export const CellDefaultsContext = createContext<CellDefaults>({})

export type ResolvedCellProps = {
  align: CellAlign
  tone: CellTone
  size: CellSize
  truncate: CellTruncate
  empty: ReactNode
}

type CellPropsInput = {
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  truncate?: CellTruncate
  empty?: ReactNode
}

/** Resolves the shared cell props as **own prop > column `meta` (via context) > component
 * default > library default**. Call once per cell with the props it received; pass `ownDefaults`
 * for a cell whose sensible default differs from the library default (e.g. `AmountCell` and
 * `ActionsCell` default `align` to `'end'`). */
export function useCellProps(props: CellPropsInput, ownDefaults: CellDefaults = {}): ResolvedCellProps {
  const column = useContext(CellDefaultsContext)
  return {
    align: props.align ?? column.align ?? ownDefaults.align ?? 'start',
    tone: props.tone ?? 'default',
    size: props.size ?? column.size ?? ownDefaults.size ?? 'md',
    truncate: props.truncate ?? column.truncate ?? ownDefaults.truncate ?? true,
    empty: props.empty ?? column.empty ?? ownDefaults.empty ?? '—',
  }
}
