import { useState } from 'react'
import type { HeaderContext } from '@tanstack/react-table'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePanel } from '@/components/DatePicker'
import type { DateRangeValue } from '@/lib/date'
import type { CellAlign } from './cells/cellVariants'

export type ColumnHeaderOptions = {
  sortable?: boolean
  /** Shows a filter icon button. It opens a real filter panel when the column declares
   * `meta: { filterType: 'date' }`; without that it stays a visual placeholder, since the other
   * filter types aren't built yet. */
  filterable?: boolean
  /** "Today" for the date panel's presets and default month. Defaults to the real clock; pass a
   * fixed date in tests (otherwise they break when the month rolls over) or in apps that reckon
   * against a books-closing date rather than today. */
  today?: Date
  /** Overrides the column's `meta.align` for the header only. Usually left unset — `meta.align`
   * already aligns the header and body together, which is what you want for e.g. an amount
   * column. */
  align?: CellAlign
}

const headerButtonClasses =
  'inline-flex items-center justify-center p-[var(--space-2)] border-0 bg-transparent text-muted-foreground cursor-pointer hover:text-foreground'

/** Returns a TanStack `header` render function combining a label with an optional sort toggle and
 * filter control, matching the reference screenshots' per-column affordance combinations.
 * The "more column options" kebab (Wrap Text / Clip Text, etc.) is a separate, real menu rendered
 * by `Table` itself for any column with `meta: { textWrap: true }` — not part of this function. */
export function columnHeader<TData>(label: string, options: ColumnHeaderOptions = {}) {
  const { sortable = false, filterable = false, today, align: alignOption } = options

  return function ColumnHeader({ column }: HeaderContext<TData, unknown>) {
    const [open, setOpen] = useState(false)
    const sorted = column.getIsSorted()
    const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown

    const filterType = column.columnDef.meta?.filterType
    const filterValue = column.getFilterValue() as DateRangeValue | undefined
    const isFiltered = Boolean(filterValue?.from || filterValue?.to)

    // 'start' keeps today's behaviour — label left, filter icon pushed to the far right via
    // justify-between. 'center'/'end' have no natural "far side" to push a lone filter icon to,
    // so the whole label+sort+filter cluster is grouped and justified as one instead.
    const align = alignOption ?? column.columnDef.meta?.align ?? 'start'
    const justify = align === 'end' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-between'

    return (
      <div className={cn('flex items-center gap-[var(--space-8)]', justify)}>
        {sortable ? (
          <button
            type="button"
            data-sort-toggle=""
            className="inline-flex items-center gap-[var(--space-4)] p-0 border-0 bg-transparent font-medium text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            {label}
            <SortIcon size={12} />
          </button>
        ) : (
          <span>{label}</span>
        )}

        {filterable && filterType === 'date' && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Filter ${label}`}
                data-column-filter=""
                // The tint is the only cue that a column is narrowing the table — without it a
                // filtered grid looks like a short one.
                className={cn(headerButtonClasses, isFiltered && 'text-primary')}
              >
                <Filter size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto border-[var(--color-border)] p-0">
              {/* Clearing is the panel's own Reset followed by Apply — no separate footer. */}
              <DateRangePanel
                mode="range"
                today={today}
                value={filterValue}
                onApply={(next) => {
                  column.setFilterValue(next.from || next.to ? next : undefined)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* No filterType declared: the affordance is still reserved, but there's nothing to open. */}
        {filterable && filterType !== 'date' && (
          <button
            type="button"
            className={headerButtonClasses}
            aria-label={`Filter ${label}`}
            data-column-filter=""
            title="Filters coming soon"
            onClick={(event) => event.preventDefault()}
          >
            <Filter size={12} />
          </button>
        )}
      </div>
    )
  }
}

/** Shorthand for `columnHeader(label, { sortable: true })`. */
export function sortableHeader<TData>(label: string) {
  return columnHeader<TData>(label, { sortable: true })
}

/** A sortable header whose filter icon opens a date-range panel. Pair with
 * `meta: { filterType: 'date' }` and `filterFn: 'dateRange'` on the column. */
export function dateColumnHeader<TData>(label: string, options: { today?: Date } = {}) {
  return columnHeader<TData>(label, { sortable: true, filterable: true, today: options.today })
}
