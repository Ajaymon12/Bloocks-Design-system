import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date'

export type DateCellProps = {
  /** A real `Date` (or an ISO string). Keep the *stored* value a date — that's what makes the
   * column sort chronologically and filter by range. Formatting the value upstream into a display
   * string like "12 Aug 2025" breaks both: sorting falls back to alphabetical, putting "9 Jan"
   * after "22 Dec". This cell exists so the display string is produced at render time only. */
  value: Date | string | number | null | undefined
  /** Shown when there's no date, instead of an empty cell. */
  fallback?: string
  className?: string
}

export function DateCell({ value, fallback = '—', className }: DateCellProps) {
  const formatted = value == null ? '' : formatDate(value)
  return (
    <span className={cn('truncate', !formatted && 'text-muted-foreground', className)}>
      {formatted || fallback}
    </span>
  )
}
