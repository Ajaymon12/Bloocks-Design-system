import { AllFiltersButton } from './AllFiltersButton'
import { compactFilterValues, countActiveFilters, isEmptyFilterValue } from './filterModel'
import { QuickFilterChip } from './QuickFilterChip'
import type { FilterField, FilterValues } from './types'
import { FilterLabelsProvider } from './useOptionLabels'
import { cn } from '@/lib/utils'

// The table's filter row — Korefi Table Standardization v1.5, §7.2: quick-filter chips for the fields
// a module marks `quickFilter`, then "All filters" for everything. Chips and panel edit the same
// controlled `value`, so a filter applied in one shows up in the other. Filtering is live: every
// change reaches `onChange` as it's made (a date once its range is complete).

export type FilterBarProps = {
  fields: FilterField[]
  value: FilterValues
  /** Fires with the compacted filters on every change from a chip or the panel. */
  onChange: (next: FilterValues) => void
  /** Injectable "today" for date presets and chip labels. */
  today?: Date
  /** Also give active non-quick filters a chip (after the quick ones), so every applied filter is
   * visible and clearable with ×. Default true. */
  showActiveNonQuickChips?: boolean
  allFiltersLabel?: string
  className?: string
}

export function FilterBar(props: FilterBarProps) {
  return (
    <FilterLabelsProvider fields={props.fields} values={props.value}>
      <FilterBarContent {...props} />
    </FilterLabelsProvider>
  )
}

function FilterBarContent({
  fields,
  value,
  onChange,
  today,
  showActiveNonQuickChips = true,
  allFiltersLabel,
  className,
}: FilterBarProps) {
  const quickFields = fields.filter((field) => field.quickFilter)
  const activeOtherFields = showActiveNonQuickChips
    ? fields.filter((field) => !field.quickFilter && !isEmptyFilterValue(field, value[field.key]))
    : []
  const count = countActiveFilters(fields, value)

  function commit(next: FilterValues) {
    onChange(compactFilterValues(fields, next))
  }

  return (
    <div role="group" aria-label="Filters" className={cn('flex flex-wrap items-center gap-[var(--space-8)]', className)}>
      {[...quickFields, ...activeOtherFields].map((field) => (
        <QuickFilterChip
          key={field.key}
          field={field}
          value={value[field.key]}
          today={today}
          onChange={(next) => commit({ ...value, [field.key]: next })}
        />
      ))}
      <AllFiltersButton fields={fields} value={value} today={today} triggerLabel={allFiltersLabel} onChange={commit} />
      <span aria-live="polite" className="sr-only">
        {count === 0 ? 'No filters applied' : `${count} ${count === 1 ? 'filter' : 'filters'} applied`}
      </span>
    </div>
  )
}
