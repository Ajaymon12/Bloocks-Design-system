import { asDateValue, asListValue, assertNever } from '../filterModel'
import type { FilterField, FilterValue } from '../types'
import { DateFieldBody } from './DateFieldBody'
import { EntityRefFieldBody } from './EntityRefFieldBody'
import { EnumFieldBody } from './EnumFieldBody'

export type FieldBodyProps = {
  field: FilterField
  value: FilterValue | undefined
  /** `isValid` is false only while a date is half-typed or has one end chosen; list fields are
   * always valid. Reported in the same call so a host sees value and validity together. */
  onChange: (next: FilterValue, isValid: boolean) => void
  today?: Date
  autoFocus?: boolean
}

/** The single place a field type maps to its input (spec §6.1). A new type is added here, and
 * `assertNever` refuses to compile until it is. */
export function FieldBody({ field, value, onChange, today, autoFocus }: FieldBodyProps) {
  switch (field.type) {
    case 'enum':
      return (
        <EnumFieldBody field={field} value={asListValue(value)} onChange={(next) => onChange(next, true)} autoFocus={autoFocus} />
      )
    case 'entity_ref':
      return (
        <EntityRefFieldBody
          field={field}
          value={asListValue(value)}
          onChange={(next) => onChange(next, true)}
          autoFocus={autoFocus}
        />
      )
    case 'date':
      return <DateFieldBody field={field} value={asDateValue(value)} today={today} onChange={onChange} />
    default:
      return assertNever(field)
  }
}
