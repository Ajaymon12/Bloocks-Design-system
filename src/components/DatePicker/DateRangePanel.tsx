import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { cn } from '@/lib/utils'
import { isSameRange } from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'
import { DateRangeFields } from './DateRangeFields'

// Figma: AIA - Component Library, "Date range" (node 667:11575). The fields themselves live in
// `DateRangeFields`; this panel adds the draft and the Reset/Apply pair for a standalone popover.
//
// Unlike FilterDropdown, this panel stages changes behind Apply. A range needs two clicks and a
// typed date is incomplete until its last digit, so committing live would filter on half-entered
// input. Every surface that hosts the panel (DateFilter, DatePicker, the Table column filter)
// shares this behaviour.

export type DateRangePanelProps = {
  mode?: 'single' | 'range'
  /** The committed value. The panel edits a draft copy and reports it only on Apply. */
  value?: DateRangeValue
  onApply: (value: DateRangeValue) => void
  /** Preset dropdown options (range mode). A "Custom" option is always appended. */
  presets?: DatePreset[]
  /** Label above the preset dropdown, e.g. "Show transactions for". */
  presetsLabel?: string
  /** Shows a Reset button beside Apply. On by default; Figma's frame omits it, but product needs a
   * way to clear the draft from inside the panel. */
  showReset?: boolean
  /** What Reset restores the draft to. Defaults to no date. */
  resetValue?: DateRangeValue
  /** "Today" for presets and the grid's today marker. Injectable so stories and tests can pin a
   * fixed date instead of flaking across midnight or between timezones. */
  today?: Date
  minDate?: Date
  maxDate?: Date
  /** 0 = Sunday … 6 = Saturday. Sunday by default, per Figma. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

const EMPTY: DateRangeValue = {}

// Figma's footer buttons are 24px tall: label-3 type with 4px vertical padding, tighter than
// Button's `sm` (8px).
const COMPACT_BUTTON = 'py-[var(--space-4)]'

export function DateRangePanel({
  mode = 'range',
  value,
  onApply,
  presets,
  presetsLabel,
  showReset = true,
  resetValue = EMPTY,
  today,
  minDate,
  maxDate,
  weekStartsOn,
  className,
}: DateRangePanelProps) {
  const isRange = mode === 'range'
  const committed = value ?? EMPTY

  // The panel mounts fresh every time its popover opens, so seeding state from `value` here is
  // enough — there's no stale draft to reconcile with a value that changed while it was closed.
  const [draft, setDraft] = useState<DateRangeValue>(committed)
  const [isValid, setIsValid] = useState(true)

  // Single mode compares the one date only, so re-picking the same day doesn't count as a change.
  const matches = (a: DateRangeValue, b: DateRangeValue) =>
    isRange ? isSameRange(a, b) : isSameRange({ from: a.from }, { from: b.from })
  const canApply = isValid && !matches(draft, committed)
  const canReset = !matches(draft, resetValue)

  function reset() {
    setDraft(isRange ? resetValue : { from: resetValue.from, to: resetValue.from })
    setIsValid(true)
  }

  function apply() {
    if (!canApply) return
    onApply(isRange ? draft : { from: draft.from, to: draft.from })
  }

  return (
    <DateRangeFields
      mode={mode}
      value={draft}
      onChange={(next, meta) => {
        setDraft(next)
        setIsValid(meta.isValid)
      }}
      presets={presets}
      presetsLabel={presetsLabel}
      today={today}
      minDate={minDate}
      maxDate={maxDate}
      weekStartsOn={weekStartsOn}
      className={className}
      footerEnd={
        <>
          {showReset && (
            <Button variant="ghost" size="sm" isDestructive isDisabled={!canReset} onClick={reset} className={COMPACT_BUTTON}>
              Reset
            </Button>
          )}
          <Button size="sm" isDisabled={!canApply} onClick={apply} className={cn(COMPACT_BUTTON, 'w-[78px]')}>
            Apply
          </Button>
        </>
      }
    />
  )
}
