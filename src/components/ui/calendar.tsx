import { DayPicker } from 'react-day-picker'
import type { ChevronProps } from 'react-day-picker'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// react-day-picker's stock stylesheet is deliberately NOT imported: the whole visual identity
// comes from the classNames map below, keyed by the library's UI / DayFlag / SelectionState
// enums, so the calendar reads as part of this system rather than as a third-party widget.

function NavChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
  return <Icon size={16} className={className} aria-hidden="true" />
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays,
  numberOfMonths = 1,
  ...props
}: CalendarProps) {
  // Outside days help a single month feel like a continuous grid, but with two months side by side
  // they render the same date twice — 30 Sep appears in both the September and October grids, which
  // is confusing to read and ambiguous to click. Off by default once more than one month is shown.
  const resolvedShowOutsideDays = showOutsideDays ?? numberOfMonths === 1

  return (
    <DayPicker
      numberOfMonths={numberOfMonths}
      showOutsideDays={resolvedShowOutsideDays}
      className={cn('font-[family-name:var(--font-family-primary)]', className)}
      classNames={{
        root: 'p-[var(--space-12)]',
        months: 'flex flex-col gap-[var(--space-16)] sm:flex-row',
        month: 'flex flex-col gap-[var(--space-8)]',
        month_caption: 'flex h-[var(--space-28)] items-center justify-center',
        caption_label:
          'text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold text-foreground',
        nav: 'flex items-center gap-[var(--space-4)] absolute right-[var(--space-12)] z-10',
        button_previous:
          'inline-flex size-[var(--space-24)] cursor-pointer items-center justify-center rounded-[var(--radius-6)] border-0 bg-transparent text-muted-foreground hover:bg-[var(--color-bg-subtle)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
        button_next:
          'inline-flex size-[var(--space-24)] cursor-pointer items-center justify-center rounded-[var(--radius-6)] border-0 bg-transparent text-muted-foreground hover:bg-[var(--color-bg-subtle)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'w-[var(--space-32)] text-[length:var(--text-body-4-size)] font-medium text-muted-foreground',
        week: 'flex w-full',
        // The cell, not the button: range tints must run edge-to-edge so consecutive days join up.
        day: 'size-[var(--space-32)] p-0 text-center',
        day_button:
          'size-full cursor-pointer rounded-[var(--radius-6)] border-0 bg-transparent text-[length:var(--text-body-3-size)] text-foreground hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed',
        // The CELL carries the fill (so a range reads as one continuous band) and the button stays
        // transparent on top. Days inside a range carry BOTH `selected` and `range_middle`, which
        // are arbitrary variants of equal specificity — so `range_middle` needs `!` on both the
        // cell background and the text to beat `selected`, on both properties. Get only one and
        // the range renders solid end-to-end, or worse, blue text on a blue fill.
        selected: 'bg-primary [&_button]:bg-transparent [&_button]:text-primary-foreground [&_button]:font-medium',
        range_start: 'rounded-l-[var(--radius-6)]',
        range_end: 'rounded-r-[var(--radius-6)]',
        range_middle:
          'bg-[var(--color-primary-subtle)]! [&_button]:text-primary! [&_button]:rounded-none [&_button]:font-normal',
        today: '[&_button]:ring-1 [&_button]:ring-[var(--color-popover-border)] [&_button]:ring-inset',
        outside: '[&_button]:text-muted-foreground [&_button]:opacity-40',
        disabled: '[&_button]:text-muted-foreground [&_button]:opacity-40 [&_button]:cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{ Chevron: NavChevron }}
      {...props}
    />
  )
}
