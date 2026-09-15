import { formatDateRange, formatISODate, getFilterDatePresets, isSameRange, matchPreset, toDate } from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'
import type { DateFilterField, FilterField, FilterValue, FilterValues } from './types'

// Pure helpers over `FilterField` + `FilterValues`. Every type switch ends in `assertNever`, so adding a
// field type fails to compile here until each helper knows what "empty" and "equal" mean for it.

export function assertNever(value: never): never {
  throw new Error(`Unhandled filter field type: ${JSON.stringify(value)}`)
}

export function asListValue(value: FilterValue | undefined): string[] {
  return Array.isArray(value) ? value : []
}

export function asDateValue(value: FilterValue | undefined): DateRangeValue {
  return value && !Array.isArray(value) ? value : {}
}

export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]
}

/** Order-insensitive: ticking A then B selects the same thing as B then A. */
export function isSameSelection(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((entry) => b.includes(entry))
}

export function getFieldDatePresets(field: DateFilterField): DatePreset[] {
  return field.presets ?? getFilterDatePresets({ weekStartsOn: field.weekStartsOn })
}

export function isEmptyFilterValue(field: FilterField, value: FilterValue | undefined): boolean {
  switch (field.type) {
    case 'enum':
    case 'entity_ref':
      return asListValue(value).length === 0
    case 'date': {
      const range = asDateValue(value)
      return !range.from && !range.to
    }
    default:
      return assertNever(field)
  }
}

/** The number shown beside a field in the All filters sidebar: selections for a list, 1 for a date. */
export function countFieldSelections(field: FilterField, value: FilterValue | undefined): number {
  switch (field.type) {
    case 'enum':
    case 'entity_ref':
      return asListValue(value).length
    case 'date':
      return isEmptyFilterValue(field, value) ? 0 : 1
    default:
      return assertNever(field)
  }
}

/** Drops empty entries and unknown keys, so what an app persists and compares stays clean. */
export function compactFilterValues(fields: FilterField[], values: FilterValues): FilterValues {
  const compacted: FilterValues = {}
  for (const field of fields) {
    const value = values[field.key]
    if (!isEmptyFilterValue(field, value)) compacted[field.key] = value
  }
  return compacted
}

export function countActiveFilters(fields: FilterField[], values: FilterValues): number {
  return fields.filter((field) => !isEmptyFilterValue(field, values[field.key])).length
}

export function areFilterValuesEqual(fields: FilterField[], a: FilterValues, b: FilterValues): boolean {
  return fields.every((field) => {
    switch (field.type) {
      case 'enum':
      case 'entity_ref':
        return isSameSelection(asListValue(a[field.key]), asListValue(b[field.key]))
      case 'date':
        return isSameRange(asDateValue(a[field.key]), asDateValue(b[field.key]))
      default:
        return assertNever(field)
    }
  })
}

/** What a FilterChip shows: option labels for a list, or a date's preset name / resolved range. */
export function getFilterChipValue(
  field: FilterField,
  value: FilterValue | undefined,
  getLabel: (fieldKey: string, value: string) => string | undefined,
  today: Date,
): string | string[] | undefined {
  if (isEmptyFilterValue(field, value)) return undefined
  switch (field.type) {
    case 'enum':
    case 'entity_ref':
      return asListValue(value).map((entry) => getLabel(field.key, entry) ?? entry)
    case 'date': {
      const range = asDateValue(value)
      return matchPreset(range, getFieldDatePresets(field), today) ?? formatDateRange(range)
    }
    default:
      return assertNever(field)
  }
}

// --- Persistence ------------------------------------------------------------------------------
// The spec persists filter state per user, per table, per company (§7.2). That's the app's job, but
// `Date` doesn't survive JSON — so the round-trip lives here once rather than in every app.

export type SerializedFilterValues = Record<string, string[] | { from?: string; to?: string }>

export function serializeFilterValues(fields: FilterField[], values: FilterValues): SerializedFilterValues {
  const serialized: SerializedFilterValues = {}
  for (const field of fields) {
    const value = values[field.key]
    if (isEmptyFilterValue(field, value)) continue
    if (field.type === 'date') {
      const range = asDateValue(value)
      const entry: { from?: string; to?: string } = {}
      if (range.from) entry.from = formatISODate(range.from)
      if (range.to) entry.to = formatISODate(range.to)
      serialized[field.key] = entry
    } else {
      serialized[field.key] = [...asListValue(value)]
    }
  }
  return serialized
}

export function deserializeFilterValues(fields: FilterField[], serialized: SerializedFilterValues): FilterValues {
  const values: FilterValues = {}
  for (const field of fields) {
    const entry = serialized[field.key]
    if (entry === undefined) continue
    if (field.type === 'date') {
      if (Array.isArray(entry)) continue
      values[field.key] = {
        from: entry.from ? toDate(entry.from) : undefined,
        to: entry.to ? toDate(entry.to) : undefined,
      }
    } else if (Array.isArray(entry)) {
      values[field.key] = entry
    }
  }
  return compactFilterValues(fields, values)
}
