import { useState } from 'react'
import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Select } from '@/components/Input/Select/Select'
import { cn } from '@/lib/utils'
import {
  DEFAULT_PRESETS,
  firstOfMonth,
  formatDate,
  formatDateRange,
  formatMonthName,
  isMonthOutsideBounds,
  isSameRange,
  matchPreset,
  shiftMonth,
} from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'

// The controlled body of the date range panel — Figma: AIA - Component Library, "Date range"
// (node 667:11575) and its day states (node 664:11225): a preset dropdown over two Sunday-first
// months side by side, each under its own boxed header with previous/next chevrons. It owns no
// draft and no Apply: `DateRangePanel` wraps it with those for a standalone popover, and the All
// filters panel hosts it directly so a date sits beside other fields under one shared Apply instead
// of a nested one.
//
// The two months navigate independently, so a start can be picked in one and an end several months
// away in the other. They always stay in order and never show the same month twice: moving one
// onto or past its partner pushes the partner along.

export type DateRangeFieldsMeta = {
  /** False while the value can't be committed: only one end of a range chosen. Hosts use it to
   * hold their Apply. */
  isValid: boolean
}

export type DateRangeFieldsProps = {
  mode?: 'single' | 'range'
  value: DateRangeValue
  onChange: (value: DateRangeValue, meta: DateRangeFieldsMeta) => void
  /** Preset dropdown options (range mode). A "Custom" option is always appended. */
  presets?: DatePreset[]
  /** Label above the preset dropdown, e.g. "Show results for". */
  presetsLabel?: string
  /** "Today" for presets. Injectable so stories and tests can pin a fixed date. */
  today?: Date
  minDate?: Date
  maxDate?: Date
  /** 0 = Sunday … 6 = Saturday. Sunday by default, per Figma. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Months shown side by side. Two in range mode and one in single mode by default; a host too
   * narrow for two (the All filters pane) passes 1. */
  months?: 1 | 2
  /** Rendered at the right under the calendars — `DateRangePanel` puts Reset and Apply here. */
  footerEnd?: ReactNode
  className?: string
}

type Side = 'left' | 'right'
type MonthPair = { left: Date; right: Date }

const SIDES: Side[] = ['left', 'right']
const CUSTOM = 'Custom'

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
  months,
  footerEnd,
  className,
}: DateRangeFieldsProps) {
  const isRange = mode === 'range'
  const monthCount = months ?? (isRange ? 2 : 1)

  /** A month is out when every one of its days is outside minDate/maxDate. */
  const isOut = (month: Date) => isMonthOutsideBounds(month.getFullYear(), month.getMonth(), minDate, maxDate)

  /** The two months that show a value: its start on the left and its end on the right, or today's
   * month and the next when there's nothing to show. */
  function monthsFor(next: DateRangeValue): MonthPair {
    const first = firstOfMonth(next.from ?? next.to ?? today)
    const last = next.to ? firstOfMonth(next.to) : first
    let left = first
    let right = last > first ? last : shiftMonth(first, 1)
    // A pair that runs past maxDate slides back one month, so the last month on show is the last one
    // with days to pick — Figma's default view for a "nothing in the future" filter, where today
    // sits in the right-hand month.
    if (monthCount === 2 && isOut(right) && !isOut(shiftMonth(left, -1))) {
      right = left
      left = shiftMonth(left, -1)
    }
    return { left, right }
  }

  const [pair, setPair] = useState<MonthPair>(() => monthsFor(value))
  const [customRequested, setCustomRequested] = useState(false)
  // The last value this component reported. A `value` that differs came from outside (a host's
  // Reset), so the visible months re-sync to it — done while rendering, like this component's other
  // derived state, rather than by remounting, which would drop focus from a Reset button rendered
  // in `footerEnd`.
  const [lastEmitted, setLastEmitted] = useState<DateRangeValue>(value)

  if (!isSameRange(value, lastEmitted)) {
    setLastEmitted(value)
    setCustomRequested(false)
    if (value.from || value.to) setPair(monthsFor(value))
  }

  // Anything that isn't exactly a preset — a hand-picked range, or no date at all — reads "Custom".
  const activePreset = isRange && !customRequested ? matchPreset(value, presets, today) : null

  // The dropdown doubles as the live readout of a hand-picked range: while it reads "Custom", the
  // option carries the dates as they're clicked in the grids. A half-picked range ends in an
  // ellipsis so it doesn't look like a one-day selection.
  const customLabel = !value.from
    ? CUSTOM
    : value.to
      ? formatDateRange(value)
      : `${formatDate(value.from)} – …`

  const disabledDays = [...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]

  /** The pair after moving one side to `target`, or null when that would leave the min/max window. */
  function move(side: Side, target: Date): MonthPair | null {
    let { left, right } = pair
    if (side === 'left') {
      left = target
      if (right <= left) right = shiftMonth(left, 1)
    } else {
      right = target
      if (left >= right) left = shiftMonth(right, -1)
    }
    if (isOut(left) || (monthCount === 2 && isOut(right))) return null
    return { left, right }
  }

  function emit(next: DateRangeValue) {
    setLastEmitted(next)
    // A range needs both ends or neither; "neither" is how a filter gets cleared.
    onChange(next, { isValid: isRange ? Boolean(next.from) === Boolean(next.to) : true })
  }

  /** A value from a preset or the grid. */
  function pick(next: DateRangeValue, { jumpToIt }: { jumpToIt: boolean }) {
    const normalized = isRange ? next : { from: next.from, to: next.from }
    if (jumpToIt && (normalized.from || normalized.to)) setPair(monthsFor(normalized))
    emit(normalized)
  }

  function choosePreset(label: string) {
    if (label === CUSTOM) {
      setCustomRequested(true)
      return
    }
    const preset = presets.find((candidate) => candidate.label === label)
    if (!preset) return
    setCustomRequested(false)
    pick(preset.getValue(today), { jumpToIt: true })
  }

  function renderCalendar(side: Side) {
    const month = pair[side]
    // Two grids side by side would repeat a date at every month boundary (30 Sep in September's
    // grid and again in October's), so outside days are left empty — Figma's empty day state. A
    // lone month keeps them as the faint disabled state.
    const shared = {
      required: false as const,
      month,
      onMonthChange: (target: Date) => {
        const next = move(side, firstOfMonth(target))
        if (next) setPair(next)
      },
      hideNavigation: true,
      showOutsideDays: monthCount === 1,
      weekStartsOn,
      today,
      disabled: disabledDays,
      classNames: PANEL_CALENDAR_CLASSES,
    }
    return isRange ? (
      <Calendar
        {...shared}
        mode="range"
        selected={value.from ? { from: value.from, to: value.to } : undefined}
        onSelect={(next) => pick({ from: next?.from, to: next?.to }, { jumpToIt: false })}
      />
    ) : (
      <Calendar
        {...shared}
        mode="single"
        selected={value.from}
        onSelect={(next) => pick({ from: next ?? undefined }, { jumpToIt: false })}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-[var(--space-8)] p-[var(--space-16)] font-[family-name:var(--font-family-primary)]',
        monthCount === 2 ? 'w-[604px]' : 'w-[312px]',
        className,
      )}
    >
      {isRange && (
        <Select
          label={presetsLabel}
          options={[...presets.map((preset) => ({ value: preset.label, label: preset.label })), { value: CUSTOM, label: customLabel }]}
          value={activePreset ?? CUSTOM}
          onChange={(event) => choosePreset(event.target.value)}
          // Figma sets this label darker and regular-weight, unlike the default field label.
          className="[&_label]:font-normal [&_label]:text-foreground"
        />
      )}

      <div className="flex items-start gap-[var(--space-12)]">
        {SIDES.slice(0, monthCount).map((side) => {
          const month = pair[side]
          const title = `${formatMonthName(month.getFullYear(), month.getMonth())} ${month.getFullYear()}`
          const previous = move(side, shiftMonth(month, -1))
          const next = move(side, shiftMonth(month, 1))
          return (
            <div key={side} className={cn('flex flex-col gap-[var(--space-12)]', monthCount === 2 ? 'w-[280px] shrink-0' : 'w-full')}>
              <MonthHeader
                title={title}
                previousLabel={`Month before ${title}`}
                onPrevious={previous ? () => setPair(previous) : undefined}
                nextLabel={`Month after ${title}`}
                onNext={next ? () => setPair(next) : undefined}
              />
              {/* Minimum height of a five-week month (weekday row + 5 × 40px + gaps), so paging
                  between five- and four-week months doesn't make the footer jump. Sized for five
                  weeks, not six, so most months carry no empty band above the footer. */}
              <div className="min-h-[240px]">{renderCalendar(side)}</div>
            </div>
          )
        })}
      </div>

      {footerEnd && <div className="flex items-center justify-end gap-[var(--space-8)] pt-[var(--space-4)]">{footerEnd}</div>}
    </div>
  )
}

// The grid stretches to its column: each day fills an equal share of the row (40px in Figma's 280px
// column) instead of sitting at a fixed size. The caption stays in the DOM but visually hidden — the
// boxed header above each grid shows the month, and the grid still needs the caption as its
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

/** The boxed month header above each grid: previous chevron, "September 2026", next chevron. Its
 * outline follows `--field-border` like the dropdown beside it, so a host that quiets its fields
 * (the All filters pane) quiets this too. The title is hidden from assistive tech because the
 * grid's own caption already names the month. */
function MonthHeader({
  title,
  previousLabel,
  onPrevious,
  nextLabel,
  onNext,
}: {
  title: string
  previousLabel: string
  onPrevious?: () => void
  nextLabel: string
  onNext?: () => void
}) {
  return (
    <div className="flex h-[34px] shrink-0 items-center justify-between rounded-[var(--radius-6)] border border-[color:var(--field-border,var(--color-input-border))] bg-card px-[var(--space-8)]">
      <IconButton accessibilityLabel={previousLabel} isDisabled={!onPrevious} onClick={onPrevious}>
        <ChevronLeft size={16} aria-hidden="true" />
      </IconButton>
      <span
        aria-hidden="true"
        className="text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-medium text-foreground"
      >
        {title}
      </span>
      <IconButton accessibilityLabel={nextLabel} isDisabled={!onNext} onClick={onNext}>
        <ChevronRight size={16} aria-hidden="true" />
      </IconButton>
    </div>
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
  onClick?: () => void
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
