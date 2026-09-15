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
  startOfWeek,
  startOfYear,
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
  { label: 'Last 7 days', getValue: (today) => ({ from: startOfDay(subDays(today, 6)), to: startOfDay(today) }) },
  { label: 'Last 30 days', getValue: (today) => ({ from: startOfDay(subDays(today, 29)), to: startOfDay(today) }) },
  { label: 'This year', getValue: (today) => ({ from: startOfYear(today), to: startOfDay(today) }) },
]

// --- Filter presets (Korefi Table Standardization v1.5, §6.1) ----------------------------------
// Indian accounting reckons in financial years running April–March, so quarters and years here are
// fiscal. "This …" presets run from the period's start to today; "Last …" presets are the whole
// closed period. On a period's first day "Today" and "This week/month" resolve to the same range,
// and `matchPreset` names it by whichever comes first in the list — "Today".

export type FilterDatePresetOptions = {
  /** 0 = Sunday … 6 = Saturday, matching the calendar the presets sit beside. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Month the financial year starts in, 0–11. April (3) by default. */
  fiscalYearStartMonth?: number
}

export function startOfFiscalYear(date: Date, startMonth = 3): Date {
  const year = date.getMonth() >= startMonth ? date.getFullYear() : date.getFullYear() - 1
  return new Date(year, startMonth, 1)
}

export function startOfFiscalQuarter(date: Date, startMonth = 3): Date {
  const monthsIntoYear = (date.getMonth() - startMonth + 12) % 12
  // A negative month index rolls back into the previous year, which is what a January quarter
  // starting in the prior October needs.
  return new Date(date.getFullYear(), date.getMonth() - (monthsIntoYear % 3), 1)
}

export function getFilterDatePresets({ weekStartsOn = 0, fiscalYearStartMonth = 3 }: FilterDatePresetOptions = {}): DatePreset[] {
  return [
    { label: 'Today', getValue: (today) => ({ from: startOfDay(today), to: startOfDay(today) }) },
    {
      label: 'Yesterday',
      getValue: (today) => ({ from: startOfDay(subDays(today, 1)), to: startOfDay(subDays(today, 1)) }),
    },
    { label: 'This week', getValue: (today) => ({ from: startOfWeek(today, { weekStartsOn }), to: startOfDay(today) }) },
    { label: 'This month', getValue: (today) => ({ from: startOfMonth(today), to: startOfDay(today) }) },
    {
      label: 'Last month',
      getValue: (today) => {
        const start = subMonths(startOfMonth(today), 1)
        return { from: start, to: startOfDay(endOfMonth(start)) }
      },
    },
    {
      label: 'This quarter',
      getValue: (today) => ({ from: startOfFiscalQuarter(today, fiscalYearStartMonth), to: startOfDay(today) }),
    },
    {
      label: 'This FY',
      getValue: (today) => ({ from: startOfFiscalYear(today, fiscalYearStartMonth), to: startOfDay(today) }),
    },
    {
      label: 'Last FY',
      getValue: (today) => {
        const thisYearStart = startOfFiscalYear(today, fiscalYearStartMonth)
        return {
          from: new Date(thisYearStart.getFullYear() - 1, fiscalYearStartMonth, 1),
          to: subDays(thisYearStart, 1),
        }
      },
    },
  ]
}

export const FILTER_DATE_PRESETS: DatePreset[] = getFilterDatePresets()

/** Calendar-date string (yyyy-MM-dd) in local time — safe to persist, unlike `toISOString()`, which
 * shifts to UTC and can land on the previous day in IST. Parse it back with `toDate`. */
export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

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

/** Day-granular equality of two ranges; an absent end only equals another absent end. */
export function isSameRange(a: DateRangeValue | undefined, b: DateRangeValue | undefined): boolean {
  const same = (x?: Date, y?: Date) => (!x && !y) || (Boolean(x) && Boolean(y) && isSameDay(x as Date, y as Date))
  return same(a?.from, b?.from) && same(a?.to, b?.to)
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

export function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a) < startOfDay(b)
}

/** True when `date` falls outside an inclusive, day-granular [min, max] window. */
export function isOutsideBounds(date: Date, min?: Date, max?: Date): boolean {
  const day = startOfDay(date)
  return (Boolean(min) && day < startOfDay(min as Date)) || (Boolean(max) && day > startOfDay(max as Date))
}

// --- Typed DD / MM / YYYY entry ---------------------------------------------------------------

export type DateParts = { day: string; month: string; year: string }

export function toDateParts(date: Date | undefined): DateParts {
  if (!date || !isValid(date)) return { day: '', month: '', year: '' }
  return { day: format(date, 'dd'), month: format(date, 'MM'), year: format(date, 'yyyy') }
}

export type DatePartsResult =
  | { status: 'empty' }
  | { status: 'incomplete' }
  | { status: 'invalid' }
  | { status: 'valid'; date: Date }

/** Distinguishes "still typing" from "finished but impossible": 31/02/2026 is complete and
 * invalid, whereas 31/02/20 is merely incomplete. The round-trip check catches the dates
 * JavaScript would otherwise silently roll over (31 Feb → 3 Mar). */
export function parseDateParts({ day, month, year }: DateParts): DatePartsResult {
  if (!day && !month && !year) return { status: 'empty' }
  if (!day || !month || year.length !== 4) return { status: 'incomplete' }
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  const date = new Date(y, m - 1, d)
  const isReal =
    m >= 1 && m <= 12 && d >= 1 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  return isReal ? { status: 'valid', date } : { status: 'invalid' }
}

// --- Month and year pickers -------------------------------------------------------------------

export const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => format(new Date(2000, index, 1), 'MMM'))

export function formatMonthName(year: number, monthIndex: number): string {
  return format(new Date(year, monthIndex, 1), 'MMMM')
}

export function firstOfMonth(date: Date): Date {
  return startOfMonth(date)
}

/** A month is unavailable only when every one of its days is out of bounds. */
export function isMonthOutsideBounds(year: number, monthIndex: number, min?: Date, max?: Date): boolean {
  const first = new Date(year, monthIndex, 1)
  return (Boolean(max) && first > startOfDay(max as Date)) || (Boolean(min) && endOfMonth(first) < startOfDay(min as Date))
}

export function isYearOutsideBounds(year: number, min?: Date, max?: Date): boolean {
  return (Boolean(max) && year > (max as Date).getFullYear()) || (Boolean(min) && year < (min as Date).getFullYear())
}
