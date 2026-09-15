import type { BadgeColor } from '@/components/Badge'
import type { DatePreset, DateRangeValue } from '@/lib/date'

// A filter field is described once, by TYPE, and every surface (quick-filter chip, All filters
// panel, table adapter) derives its behaviour from that — Korefi Table Standardization v1.5, §5 and
// §6.1: "All UX behavior is defined per field type, never per module." Add a type by extending the
// `FilterField` union; `assertNever` in the switches makes every surface a compile error until it
// handles the new type.

export type FilterOption = {
  value: string
  label: string
  /** Renders the option as a coloured Badge (status-like enums) instead of plain text. */
  color?: BadgeColor
  disabled?: boolean
}

type BaseFilterField = {
  /** Stable identifier — also the key in `FilterValues` and what an app persists. */
  key: string
  label: string
  /** Shown as its own chip in the filter bar (spec: `quick_filter_default`). */
  quickFilter?: boolean
  /** The TanStack column this field filters. Defaults to `key`. */
  columnId?: string
}

/** Fixed option set, e.g. Account type or Status — a checklist, searchable past `searchThreshold`. */
export type EnumFilterField = BaseFilterField & {
  type: 'enum'
  options: FilterOption[]
  /** Search appears once there are more options than this. Default 8 (spec §6.1). */
  searchThreshold?: number
}

export type FilterOptionsLoader = (query: string, context: { signal: AbortSignal }) => Promise<FilterOption[]>

/** A reference to another object, e.g. Bank ledger or Vendor — options come from async search. */
export type EntityRefFilterField = BaseFilterField & {
  type: 'entity_ref'
  /** Called with the trimmed search text ('' for the initial list). Abort when `signal` fires. */
  loadOptions: FilterOptionsLoader
  /** Labels for selected ids that aren't in the current results — e.g. a filter restored from
   * persistence. Without it those selections show their raw id until they're searched for. */
  resolveOptions?: (values: string[], context: { signal: AbortSignal }) => Promise<FilterOption[]>
  /** Known labels to seed the cache with, avoiding a resolve round-trip. */
  initialOptions?: FilterOption[]
  /** Delay before a typed query is sent. Default 250ms. */
  debounceMs?: number
  searchPlaceholder?: string
}

export type DateFilterField = BaseFilterField & {
  type: 'date'
  /** Defaults to the spec's presets: Today … Last FY (FY = April–March). */
  presets?: DatePreset[]
  minDate?: Date
  maxDate?: Date
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export type FilterField = EnumFilterField | EntityRefFilterField | DateFilterField

/** List types are "is any of" in v1 — the selected option values. */
export type ListFilterValue = string[]
export type FilterValue = ListFilterValue | DateRangeValue

/** Committed filter state keyed by field key. Only non-empty values are kept: a missing key means
 * the field doesn't filter. */
export type FilterValues = Record<string, FilterValue | undefined>
