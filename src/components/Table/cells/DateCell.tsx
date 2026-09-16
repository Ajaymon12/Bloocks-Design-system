import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date'
import { useCellProps } from './cellContext'
import type { CellAlign, CellTruncate } from './cellVariants'
import { CELL_TEXT_ALIGN } from './cellVariants'

export type DateCellProps = {
  /** A real `Date` (or an ISO string). Keep the *stored* value a date — that's what makes the
   * column sort chronologically and filter by range. Formatting the value upstream into a display
   * string like "12 Aug 2025" breaks both: sorting falls back to alphabetical, putting "9 Jan"
   * after "22 Dec". This cell exists so the display string is produced at render time only. */
  value: Date | string | number | null | undefined
  /** @deprecated Use `empty`. */
  fallback?: string
  align?: CellAlign
  truncate?: CellTruncate
  empty?: React.ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

export function DateCell({ value, fallback, align, truncate, empty = fallback, isDisabled, tooltip, className }: DateCellProps) {
  const resolved = useCellProps({ align, truncate, empty })
  const formatted = value == null ? '' : formatDate(value)

  return (
    <span
      title={tooltip}
      className={cn(
        'block',
        resolved.truncate ? 'truncate' : 'whitespace-normal break-words',
        CELL_TEXT_ALIGN[resolved.align],
        !formatted && 'text-muted-foreground',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {formatted || resolved.empty}
    </span>
  )
}
