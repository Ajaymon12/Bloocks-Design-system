import {
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

// Every date-fns call in the design system funnels through this module, so swapping the date
// library later touches one file rather than every component.

export type DateRangeValue = { from?: Date; to?: Date }

/** A named shortcut in the picker's sidebar. `getValue` takes "today" as a parameter rather than
 * calling `new Date()` itself — that's what lets stories and tests pin a fixed date instead of
 * flaking across midnight and across timezones. */
export type DatePreset = { label: string; getValue: (today: Date) => DateRangeValue }

export const DEFAULT_PRESETS: DatePreset[] = [
  { label: 'Today', getValue: (today) => ({ from: startOfDay(today), to: startOfDay(today) }) },
  {
    label: 'Yesterday',
    getValue: (today) => {
      const day = startOfDay(subDays(today, 1))
      return { from: day, to: day }
    },
  },
  { label: 'Last 7 days', getValue: (today) => ({ from: startOfDay(subDays(today, 6)), to: startOfDay(today) }) },
  { label: 'Last 30 days', getValue: (today) => ({ from: startOfDay(subDays(today, 29)), to: startOfDay(today) }) },
  { label: 'This month', getValue: (today) => ({ from: startOfMonth(today), to: startOfDay(today) }) },
  {
    label: 'Last month',
    getValue: (today) => {
      const previous = subMonths(today, 1)
      return { from: startOfMonth(previous), to: endOfMonth(previous) }
    },
  },
]

/** Accepts the `Date | string` a table column might hold — ISO strings are common in API payloads. */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : new Date(value)
}

export function formatDate(value: Date | string | number): string {
  const date = toDate(value)
  return isValid(date) ? format(date, 'd MMM yyyy') : ''
}

/** Collapses the parts both ends share, so a range reads "12 – 19 Aug 2026" rather than
 * "12 Aug 2026 – 19 Aug 2026". */
export function formatDateRange(range: DateRangeValue | undefined): string {
  if (!range?.from) return ''
  const { from, to } = range
  if (!to || isSameDay(from, to)) return formatDate(from)
  if (isSameMonth(from, to) && isSameYear(from, to)) return `${format(from, 'd')} – ${formatDate(to)}`
  if (isSameYear(from, to)) return `${format(from, 'd MMM')} – ${formatDate(to)}`
  return `${formatDate(from)} – ${formatDate(to)}`
}

/** The label of the preset this range corresponds to, or null for a hand-picked range. Lets a
 * filter chip read "Last 30 days" instead of the two dates it resolves to. */
export function matchPreset(
  range: DateRangeValue | undefined,
  presets: DatePreset[],
  today: Date,
): string | null {
  if (!range?.from) return null
  for (const preset of presets) {
    const candidate = preset.getValue(today)
    if (!candidate.from) continue
    const sameFrom = isSameDay(candidate.from, range.from)
    const sameTo =
      candidate.to && range.to ? isSameDay(candidate.to, range.to) : !candidate.to && !range.to
    if (sameFrom && sameTo) return preset.label
  }
  return null
}

/** Inclusive on both ends, and day-granular — a row stamped 14:30 still matches a `to` of that
 * same day, which a naive `<=` on the raw timestamps would exclude. */
export function isWithinRange(value: Date | string | number, range: DateRangeValue): boolean {
  const date = startOfDay(toDate(value))
  if (!isValid(date)) return false
  if (range.from && date < startOfDay(range.from)) return false
  if (range.to && date > startOfDay(range.to)) return false
  return true
}
