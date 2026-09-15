import { useState } from 'react'
import { Button } from '@/components/Button/Button'
import { DateRangeFields } from '@/components/DatePicker/DateRangeFields'
import type { DateRangeValue } from '@/lib/date'
import { asDateValue, asListValue, getFieldDatePresets } from './filterModel'
import { FieldBody } from './fields/FieldBody'
import type { DateFilterField, EntityRefFilterField, EnumFilterField, FilterField, FilterValue } from './types'
import { FilterLabelsProvider } from './useOptionLabels'

export type FilterFieldPanelProps = {
  field: FilterField
  value: FilterValue | undefined
  /** Fires on every change — filtering is live. `undefined` means the field was cleared. A date
   * only fires once its range is complete. */
  onChange: (next: FilterValue | undefined) => void
  today?: Date
}

const COMPACT_BUTTON = 'py-[var(--space-4)]'

/** One field's input — what a quick-filter chip opens. Live like the All filters panel, so a chip and
 * the panel behave the same; Reset clears the field. */
export function FilterFieldPanel({ field, value, onChange, today }: FilterFieldPanelProps) {
  if (field.type === 'date') return <DateFieldPanel field={field} value={asDateValue(value)} onChange={onChange} today={today} />
  return <ListFieldPanel field={field} value={asListValue(value)} onChange={onChange} />
}

function ListFieldPanel({
  field,
  value,
  onChange,
}: {
  field: EnumFilterField | EntityRefFilterField
  value: string[]
  onChange: (next: string[] | undefined) => void
}) {
  return (
    <FilterLabelsProvider fields={[field]} values={{ [field.key]: value }}>
      <div className="flex w-[280px] flex-col font-[family-name:var(--font-family-primary)]">
        <div className="flex max-h-[320px] min-h-[var(--space-48)] flex-col pt-[var(--space-4)]">
          <FieldBody
            field={field}
            value={value}
            onChange={(next) => {
              const list = asListValue(next)
              onChange(list.length > 0 ? list : undefined)
            }}
            autoFocus
          />
        </div>
        <div className="flex items-center justify-end border-t border-[var(--color-border-subtle)] px-[var(--space-12)] py-[var(--space-8)]">
          <Button
            variant="ghost"
            size="sm"
            isDestructive
            isDisabled={value.length === 0}
            onClick={() => onChange(undefined)}
            className={COMPACT_BUTTON}
          >
            Reset
          </Button>
        </div>
      </div>
    </FilterLabelsProvider>
  )
}

function DateFieldPanel({
  field,
  value,
  onChange,
  today,
}: {
  field: DateFilterField
  value: DateRangeValue
  onChange: (next: DateRangeValue | undefined) => void
  today?: Date
}) {
  // Holds a range while it's incomplete (first day clicked, digits half-typed); the applied value
  // only changes once it's whole.
  const [draft, setDraft] = useState<DateRangeValue>(value)

  return (
    <DateRangeFields
      mode="range"
      value={draft}
      onChange={(next, meta) => {
        setDraft(next)
        if (meta.isValid) onChange(next.from || next.to ? next : undefined)
      }}
      presets={getFieldDatePresets(field)}
      today={today}
      minDate={field.minDate}
      maxDate={field.maxDate}
      weekStartsOn={field.weekStartsOn}
      footerEnd={
        <Button
          variant="ghost"
          size="sm"
          isDestructive
          isDisabled={!draft.from && !draft.to}
          onClick={() => {
            setDraft({})
            onChange(undefined)
          }}
          className={COMPACT_BUTTON}
        >
          Reset
        </Button>
      }
    />
  )
}
