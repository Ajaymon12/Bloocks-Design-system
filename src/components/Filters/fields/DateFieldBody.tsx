import { DateRangeFields } from '@/components/DatePicker/DateRangeFields'
import type { DateRangeValue } from '@/lib/date'
import { getFieldDatePresets } from '../filterModel'
import type { DateFilterField } from '../types'

export type DateFieldBodyProps = {
  field: DateFilterField
  value: DateRangeValue
  onChange: (next: DateRangeValue, isValid: boolean) => void
  today?: Date
}

/** The date range UI from DateFilter, minus its Reset/Apply footer — the host decides when a change
 * is applied (the filter panels apply it as soon as `isValid`). Presets default to the spec's list
 * (Today … Last FY). */
export function DateFieldBody({ field, value, onChange, today }: DateFieldBodyProps) {
  return (
    <DateRangeFields
      mode="range"
      value={value}
      onChange={(next, meta) => onChange(next, meta.isValid)}
      presets={getFieldDatePresets(field)}
      presetsLabel="Date range"
      today={today}
      minDate={field.minDate}
      maxDate={field.maxDate}
      weekStartsOn={field.weekStartsOn}
      // The pane header already supplies the top spacing and the field name.
      className="w-full pt-0"
    />
  )
}
