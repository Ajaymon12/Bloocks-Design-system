import type { HeaderContext } from '@tanstack/react-table'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react'

export type ColumnHeaderOptions = {
  sortable?: boolean
  /** Shows a filter icon button. Inert for now — full column filtering isn't wired up yet, this
   * is a visual placeholder to reserve the space/affordance until the real filter components land. */
  filterable?: boolean
}

const headerButtonClasses =
  'inline-flex items-center justify-center p-[var(--space-2)] border-0 bg-transparent text-muted-foreground cursor-pointer hover:text-foreground'

/** Returns a TanStack `header` render function combining a label with an optional sort toggle and
 * filter placeholder, matching the reference screenshots' per-column affordance combinations.
 * The "more column options" kebab (Wrap Text / Clip Text, etc.) is a separate, real menu rendered
 * by `Table` itself for any column with `meta: { textWrap: true }` — not part of this function. */
export function columnHeader<TData>(label: string, options: ColumnHeaderOptions = {}) {
  const { sortable = false, filterable = false } = options

  return ({ column }: HeaderContext<TData, unknown>) => {
    const sorted = column.getIsSorted()
    const SortIcon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown

    return (
      <div className="flex items-center justify-between gap-[var(--space-8)]">
        {sortable ? (
          <button
            type="button"
            className="inline-flex items-center gap-[var(--space-4)] p-0 border-0 bg-transparent font-medium text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            {label}
            <SortIcon size={12} />
          </button>
        ) : (
          <span>{label}</span>
        )}
        {filterable && (
          <button
            type="button"
            className={headerButtonClasses}
            aria-label={`Filter ${label}`}
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
