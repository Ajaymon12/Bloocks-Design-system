import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterChip } from '@/components/FilterChip'
import { DateRangePanel } from './DateRangePanel'
import { DEFAULT_PRESETS, formatDateRange, matchPreset } from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'

export type DateFilterProps = {
  /** Closed-state chip text, e.g. "Date". */
  label: string
  value?: DateRangeValue
  defaultValue?: DateRangeValue
  /** Fires on every pick — filtering is live, there is no Apply step. */
  onChange?: (value: DateRangeValue) => void
  presets?: DatePreset[]
  /** Injectable "today" so stories and tests can pin a fixed date. */
  today?: Date
  /** `'compact'` shows a matched preset's name ("Last 30 days"); `'default'` always shows the
   * resolved dates. Mirrors Blade's displayFormat. */
  displayFormat?: 'compact' | 'default'
  /** Set `false` for a filter that must always hold a range, e.g. a mandatory reporting period. */
  showClearButton?: boolean
  minDate?: Date
  maxDate?: Date
  isDisabled?: boolean
  accessibilityLabel?: string
  className?: string
}

/** A date range filter for a filter bar: FilterChip trigger + calendar panel, so it sits beside
 * FilterDropdown and clears the same way. */
export function DateFilter({
  label,
  value,
  defaultValue,
  onChange,
  presets = DEFAULT_PRESETS,
  today = new Date(),
  displayFormat = 'compact',
  showClearButton = true,
  minDate,
  maxDate,
  isDisabled = false,
  accessibilityLabel,
  className,
}: DateFilterProps) {
  const [open, setOpen] = useState(false)
  // Uncontrolled fallback, so the component works without a `value` prop.
  const [internal, setInternal] = useState<DateRangeValue | undefined>(defaultValue)
  const selected = value ?? internal

  function commit(next: DateRangeValue) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const presetLabel = displayFormat === 'compact' ? matchPreset(selected, presets, today) : null
  const chipValue = selected?.from ? (presetLabel ?? formatDateRange(selected)) : undefined

  return (
    <Popover open={open} onOpenChange={(next) => !isDisabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <FilterChip
          label={label}
          value={chipValue}
          showClearButton={showClearButton}
          onClearButtonClick={() => commit({})}
          isDisabled={isDisabled}
          aria-label={accessibilityLabel ?? label}
          className={className}
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <DateRangePanel
          mode="range"
          value={selected}
          onChange={commit}
          presets={presets}
          today={today}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  )
}
