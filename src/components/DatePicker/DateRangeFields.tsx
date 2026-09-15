import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Select } from '@/components/Input/Select/Select'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PRESETS,
  MONTH_LABELS,
  firstOfMonth,
  formatMonthName,
  isBeforeDay,
  isMonthOutsideBounds,
  isSameRange,
  isYearOutsideBounds,
  matchPreset,
} from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'
import { DateSegmentInput } from './DateSegmentInput'
import type { DateSegmentStatus } from './DateSegmentInput'

// The controlled body of the date range panel — Figma: AIA - Component Library, "Date range"
// (node 667:11575): preset dropdown, typed From/To fields over a single Sunday-first month, month and
// year pickers in the footer row. It owns no draft and no Apply: `DateRangePanel` wraps it with those
// for a standalone popover, and the All filters panel hosts it directly so a date sits beside other
// fields under one shared Apply instead of a nested one.

export type DateRangeFieldsMeta = {
  /** False while the value can't be committed: a half-typed or impossible date, To before From, or
   * only one end of a range chosen. Hosts use it to hold their Apply. */
  isValid: boolean
}

export type DateRangeFieldsProps = {
  mode?: 'single' | 'range'
  value: DateRangeValue
  onChange: (value: DateRangeValue, meta: DateRangeFieldsMeta) => void
  /** Preset dropdown options (range mode). A "Custom" option is always appended. */
  presets?: DatePreset[]
  /** Label above the preset dropdown, e.g. "Show transactions for". */
  presetsLabel?: string
  /** "Today" for presets. Injectable so stories and tests can pin a fixed date. */
  today?: Date
  minDate?: Date
  maxDate?: Date
  /** 0 = Sunday … 6 = Saturday. Sunday by default, per Figma. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Rendered at the right of the month/year row — `DateRangePanel` puts Reset and Apply here. */
  footerEnd?: ReactNode
  className?: string
}

type View = 'days' | 'months' | 'years'

const YEARS_PER_PAGE = 12
const CUSTOM = 'Custom'

function statusOf(date: Date | undefined): DateSegmentStatus {
  return date ? 'valid' : 'empty'
}

export function DateRangeFields({
  mode = 'range',
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  presetsLabel = 'Date range',
  today = new Date(),
  minDate,
  maxDate,
  weekStartsOn = 0,
  footerEnd,
  className,
}: DateRangeFieldsProps) {
  const isRange = mode === 'range'

  const [fromStatus, setFromStatus] = useState<DateSegmentStatus>(statusOf(value.from))
  const [toStatus, setToStatus] = useState<DateSegmentStatus>(statusOf(value.to))
  const [displayMonth, setDisplayMonth] = useState(() => firstOfMonth(value.to ?? value.from ?? today))
  const [view, setView] = useState<View>('days')
  const [yearPageStart, setYearPageStart] = useState(() => displayMonth.getFullYear() - 6)
  const [customRequested, setCustomRequested] = useState(false)
  // The last value this component reported. A `value` that differs came from outside (a host's
  // Reset), so the typed-field statuses and the visible month re-sync to it — done while rendering,
  // like DateSegmentInput, rather than by remounting, which would drop focus from a Reset button
  // rendered in `footerEnd`.
  const [lastEmitted, setLastEmitted] = useState<DateRangeValue>(value)
  const firstInputRef = useRef<HTMLInputElement>(null)

  if (!isSameRange(value, lastEmitted)) {
    setLastEmitted(value)
    setFromStatus(statusOf(value.from))
    setToStatus(statusOf(value.to))
    setCustomRequested(false)
    const anchor = value.to ?? value.from
    if (anchor) {
      setDisplayMonth(firstOfMonth(anchor))
      setView('days')
    }
  }

  const displayYear = displayMonth.getFullYear()
  const displayMonthIndex = displayMonth.getMonth()

  // Anything that isn't exactly a preset — a hand-picked range, or no date at all — reads "Custom".
  const activePreset = isRange && !customRequested ? matchPreset(value, presets, today) : null

  // The calendar can't produce an inverted range, but two typed fields can.
  const rangeError =
    isRange && value.from && value.to && isBeforeDay(value.to, value.from) ? 'Must be on or after the From date' : undefined

  const disabledDays = [...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]

  function isValidFor(next: DateRangeValue, from: DateSegmentStatus, to: DateSegmentStatus) {
    const statuses = isRange ? [from, to] : [from]
    if (statuses.some((status) => status === 'incomplete' || status === 'invalid')) return false
    if (isRange && next.from && next.to && isBeforeDay(next.to, next.from)) return false
    // A range needs both ends or neither; "neither" is how a filter gets cleared.
    return isRange ? Boolean(next.from) === Boolean(next.to) : true
  }

  function emit(next: DateRangeValue, from: DateSegmentStatus, to: DateSegmentStatus) {
    setLastEmitted(next)
    onChange(next, { isValid: isValidFor(next, from, to) })
  }

  /** A value from a preset or the grid — anything that isn't typed. */
  function pick(next: DateRangeValue, { jumpToIt }: { jumpToIt: boolean }) {
    const normalized = isRange ? next : { from: next.from, to: next.from }
    const from = statusOf(normalized.from)
    const to = statusOf(normalized.to)
    setFromStatus(from)
    setToStatus(to)
    const anchor = normalized.to ?? normalized.from
    if (jumpToIt && anchor) {
      setDisplayMonth(firstOfMonth(anchor))
      setView('days')
    }
    emit(normalized, from, to)
  }

  function typed(end: 'from' | 'to', date: Date | undefined, status: DateSegmentStatus) {
    const from = end === 'from' ? status : fromStatus
    const to = end === 'to' ? status : toStatus
    setFromStatus(from)
    setToStatus(to)
    if (date) {
      setDisplayMonth(firstOfMonth(date))
      setView('days')
    }
    emit(isRange ? { ...value, [end]: date } : { from: date, to: date }, from, to)
  }

  function choosePreset(label: string) {
    if (label === CUSTOM) {
      setCustomRequested(true)
      setView('days')
      firstInputRef.current?.focus()
      return
    }
    const preset = presets.find((candidate) => candidate.label === label)
    if (!preset) return
    setCustomRequested(false)
    pick(preset.getValue(today), { jumpToIt: true })
  }

  return (
    <div
      className={cn(
        'flex w-[312px] flex-col gap-[var(--space-8)] p-[var(--space-16)] font-[family-name:var(--font-family-primary)]',
        // Select and DateSegmentInput take their resting outline from the global `border-border`
        // reset rather than a class (see BaseInput.tsx), so re-pointing `--border` here quiets the
        // preset dropdown and the date fields together without forking either component. Focus,
        // hover and error borders are explicit classes and still win. The fields set `--border`
        // themselves (to the input outline), so `--field-border` is what reaches them.
        '[--border:var(--color-border-subtle)] [--field-border:var(--color-border-subtle)]',
        className,
      )}
    >
      {isRange && (
        <Select
          label={presetsLabel}
          size="sm"
          options={[...presets.map((preset) => ({ value: preset.label, label: preset.label })), { value: CUSTOM, label: CUSTOM }]}
          value={activePreset ?? CUSTOM}
          onChange={(event) => choosePreset(event.target.value)}
        />
      )}

      <div className="flex flex-col gap-[var(--space-12)] py-[var(--space-12)]">
        {isRange ? (
          <div className="flex items-start gap-[var(--space-12)]">
            <DateSegmentInput
              ref={firstInputRef}
              label="From date"
              value={value.from}
              onChange={(date, status) => typed('from', date, status)}
              minDate={minDate}
              maxDate={maxDate}
            />
            <DateSegmentInput
              label="To date"
              value={value.to}
              onChange={(date, status) => typed('to', date, status)}
              minDate={minDate}
              maxDate={maxDate}
              error={rangeError}
            />
          </div>
        ) : (
          <DateSegmentInput
            ref={firstInputRef}
            label="Date"
            value={value.from}
            onChange={(date, status) => typed('from', date, status)}
            minDate={minDate}
            maxDate={maxDate}
          />
        )}

        {/* Minimum height of a five-week month (weekday row + 5 × 40px + gaps), so switching to the
            shorter month or year grid doesn't make the footer jump. Sized for five weeks, not six,
            so most months carry no empty band above the footer. */}
        <div className="min-h-[240px]">
          {view === 'days' &&
            (isRange ? (
              <Calendar
                mode="range"
                required={false}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                hideNavigation
                weekStartsOn={weekStartsOn}
                today={today}
                selected={value.from ? { from: value.from, to: rangeError ? undefined : value.to } : undefined}
                onSelect={(next) => pick({ from: next?.from, to: next?.to }, { jumpToIt: false })}
                disabled={disabledDays}
                classNames={PANEL_CALENDAR_CLASSES}
              />
            ) : (
              <Calendar
                mode="single"
                required={false}
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                hideNavigation
                weekStartsOn={weekStartsOn}
                today={today}
                selected={value.from}
                onSelect={(next) => pick({ from: next ?? undefined }, { jumpToIt: false })}
                disabled={disabledDays}
                classNames={PANEL_CALENDAR_CLASSES}
              />
            ))}

          {view === 'months' && (
            <div role="group" aria-label={`Months in ${displayYear}`} className="grid grid-cols-3 gap-[var(--space-8)]">
              {MONTH_LABELS.map((label, monthIndex) => (
                <GridButton
                  key={label}
                  label={label}
                  accessibilityLabel={formatMonthName(displayYear, monthIndex)}
                  isSelected={monthIndex === displayMonthIndex}
                  isDisabled={isMonthOutsideBounds(displayYear, monthIndex, minDate, maxDate)}
                  onClick={() => {
                    setDisplayMonth(new Date(displayYear, monthIndex, 1))
                    setView('days')
                  }}
                />
              ))}
            </div>
          )}

          {view === 'years' && (
            <div className="flex flex-col gap-[var(--space-8)]">
              <div className="flex items-center justify-between">
                <IconButton
                  accessibilityLabel="Earlier years"
                  isDisabled={Boolean(minDate) && yearPageStart <= (minDate as Date).getFullYear()}
                  onClick={() => setYearPageStart((start) => start - YEARS_PER_PAGE)}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </IconButton>
                <span className="text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold text-foreground">
                  {yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
                </span>
                <IconButton
                  accessibilityLabel="Later years"
                  isDisabled={Boolean(maxDate) && yearPageStart + YEARS_PER_PAGE - 1 >= (maxDate as Date).getFullYear()}
                  onClick={() => setYearPageStart((start) => start + YEARS_PER_PAGE)}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </IconButton>
              </div>
              <div role="group" aria-label="Years" className="grid grid-cols-4 gap-[var(--space-8)]">
                {Array.from({ length: YEARS_PER_PAGE }, (_, offset) => yearPageStart + offset).map((year) => (
                  <GridButton
                    key={year}
                    label={String(year)}
                    isSelected={year === displayYear}
                    isDisabled={isYearOutsideBounds(year, minDate, maxDate)}
                    onClick={() => {
                      setDisplayMonth(new Date(year, displayMonthIndex, 1))
                      setView('days')
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-[var(--space-8)]">
        <div className="flex w-[120px] gap-[var(--space-8)]">
          <PickerToggle
            label={MONTH_LABELS[displayMonthIndex]}
            accessibilityLabel={`Choose month, ${formatMonthName(displayYear, displayMonthIndex)}`}
            isPressed={view === 'months'}
            onClick={() => setView((current) => (current === 'months' ? 'days' : 'months'))}
          />
          <PickerToggle
            label={String(displayYear)}
            accessibilityLabel={`Choose year, ${displayYear}`}
            isPressed={view === 'years'}
            onClick={() => {
              setYearPageStart(displayYear - 6)
              setView((current) => (current === 'years' ? 'days' : 'years'))
            }}
          />
        </div>
        {footerEnd && <div className="flex items-center gap-[var(--space-8)]">{footerEnd}</div>}
      </div>
    </div>
  )
}

// The grid stretches to the panel: each day fills an equal share of the row (40px at Figma's
// 312px width) instead of sitting at a fixed size. The caption stays in the DOM but visually
// hidden — the footer buttons show the month, and the grid still needs the caption as its
// accessible name.
//
// This map replaces the base Calendar's selection styling rather than extending it. The ends of a
// selection are a 28px primary circle (the button) on a neutral band (the cell) whose outer ends
// are rounded; the band breaks square at week edges, as in Figma. Days inside a range carry BOTH
// `selected` and `range_middle`, so `range_middle` needs `!` to strip the circle `selected` gave.
const PANEL_CALENDAR_CLASSES = {
  root: 'w-full',
  months: 'w-full',
  month: 'flex w-full flex-col',
  month_caption: 'sr-only',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex w-full',
  weekday:
    'flex h-[var(--space-24)] flex-1 items-center justify-center text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] font-normal text-primary',
  weeks: 'flex flex-col gap-[var(--space-4)]',
  week: 'flex w-full',
  day: 'flex h-[var(--space-40)] flex-1 items-center justify-center p-0',
  day_button:
    'size-[var(--space-28)] cursor-pointer rounded-full border-0 bg-transparent text-[length:var(--text-body-4-size)] leading-[var(--text-body-3-line-height)] tabular-nums text-foreground hover:bg-[var(--color-surface-subtle)] disabled:cursor-not-allowed',
  selected:
    '[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-[var(--color-primary-hover)]',
  range_start: 'rounded-l-[var(--radius-6)] bg-[var(--color-surface-subtle)]',
  range_end: 'rounded-r-[var(--radius-6)] bg-[var(--color-surface-subtle)]',
  range_middle:
    'bg-[var(--color-surface-subtle)] [&_button]:bg-transparent! [&_button]:text-foreground! [&_button]:hover:bg-[var(--color-border)]!',
  // Figma marks no "today" in the grid — the Today preset selects it instead.
  today: '',
  outside: '[&_button]:text-muted-foreground [&_button]:opacity-30',
  disabled: '[&_button]:cursor-not-allowed [&_button]:text-muted-foreground [&_button]:opacity-30 [&_button]:hover:bg-transparent',
  hidden: 'invisible',
}

function PickerToggle({
  label,
  accessibilityLabel,
  isPressed,
  onClick,
}: {
  label: string
  accessibilityLabel: string
  isPressed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-pressed={isPressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-6)] border px-[var(--space-12)] py-[var(--space-4)]',
        'bg-[var(--color-primary-subtle)] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium',
        'transition-colors duration-150',
        isPressed
          ? 'border-[var(--color-primary)] text-primary'
          : 'border-[var(--color-popover-border)] text-foreground hover:border-[var(--color-primary)]',
      )}
    >
      {label}
    </button>
  )
}

function GridButton({
  label,
  accessibilityLabel,
  isSelected,
  isDisabled,
  onClick,
}: {
  label: string
  accessibilityLabel?: string
  isSelected: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'h-[var(--space-40)] cursor-pointer rounded-[var(--radius-6)] border-0 text-[length:var(--text-body-4-size)]',
        'disabled:cursor-not-allowed disabled:opacity-30',
        isSelected
          ? 'bg-primary font-medium text-primary-foreground'
          : 'bg-transparent text-foreground hover:bg-[var(--color-surface-subtle)]',
      )}
    >
      {label}
    </button>
  )
}

function IconButton({
  accessibilityLabel,
  isDisabled,
  onClick,
  children,
}: {
  accessibilityLabel: string
  isDisabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      disabled={isDisabled}
      onClick={onClick}
      className="inline-flex size-[var(--space-24)] cursor-pointer items-center justify-center rounded-[var(--radius-6)] border-0 bg-transparent text-muted-foreground hover:bg-[var(--color-surface-subtle)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
