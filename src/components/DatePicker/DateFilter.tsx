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
  /** Fires when the user presses Apply, or clears the chip with its ×. Picking dates in the panel
   * doesn't fire it — a range isn't final until both ends are chosen. */
  onChange?: (value: DateRangeValue) => void
  presets?: DatePreset[]
  /** Label above the panel's preset dropdown, e.g. "Show transactions for". */
  presetsLabel?: string
  /** What the panel's Reset restores. Defaults to no date. */
  resetValue?: DateRangeValue
  /** Injectable "today" so stories and tests can pin a fixed date. */
  today?: Date
  /** `'compact'` shows a matched preset's name ("Last 30 days"); `'default'` always shows the
   * resolved dates. Mirrors Blade's displayFormat. */
  displayFormat?: 'compact' | 'default'
  /** Set `false` for a filter that must always hold a range, e.g. a mandatory reporting period. */
  showClearButton?: boolean
  minDate?: Date
  maxDate?: Date
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
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
  presetsLabel,
  resetValue,
  today = new Date(),
  displayFormat = 'compact',
  showClearButton = true,
  minDate,
  maxDate,
  weekStartsOn,
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

      <PopoverContent align="start" className="w-auto border-[var(--color-border)] p-0">
        <DateRangePanel
          mode="range"
          value={selected}
          onApply={(next) => {
            commit(next)
            setOpen(false)
          }}
          presets={presets}
          presetsLabel={presetsLabel}
          resetValue={resetValue}
          today={today}
          minDate={minDate}
          maxDate={maxDate}
          weekStartsOn={weekStartsOn}
        />
      </PopoverContent>
    </Popover>
  )
}
