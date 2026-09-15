import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { DEFAULT_PRESETS, formatDateRange, matchPreset } from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'

export type DateRangePanelProps = {
  mode?: 'single' | 'range'
  value?: DateRangeValue
  /** Fires on every pick — live, matching FilterDropdown and ColumnCustomizer. No Apply step. */
  onChange: (value: DateRangeValue) => void
  /** Sidebar shortcuts. Pass `[]` to hide the sidebar entirely. */
  presets?: DatePreset[]
  /** "Today" for preset resolution and calendar highlighting. Injectable so stories and tests can
   * pin a fixed date instead of flaking across midnight or between timezones. */
  today?: Date
  numberOfMonths?: number
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DateRangePanel({
  mode = 'range',
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  today = new Date(),
  numberOfMonths = mode === 'range' ? 2 : 1,
  minDate,
  maxDate,
  className,
}: DateRangePanelProps) {
  const activePreset = mode === 'range' ? matchPreset(value, presets, today) : null
  const showPresets = mode === 'range' && presets.length > 0

  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ]

  return (
    <div className={cn('flex font-[family-name:var(--font-family-primary)]', className)}>
      {showPresets && (
        <div className="flex w-[136px] shrink-0 flex-col gap-[var(--space-2)] border-r border-[var(--color-table-border)] p-[var(--space-8)]">
          {presets.map((preset) => {
            const isActive = preset.label === activePreset
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(preset.getValue(today))}
                className={cn(
                  'cursor-pointer rounded-[var(--radius-6)] border-0 px-[var(--space-8)] py-[var(--space-4)] text-left',
                  'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
                  isActive
                    ? 'bg-[var(--color-primary-subtle)] font-medium text-primary'
                    : 'bg-transparent text-foreground hover:bg-[var(--color-bg-subtle)]',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {mode === 'range' ? (
          <Calendar
            mode="range"
            required={false}
            numberOfMonths={numberOfMonths}
            defaultMonth={value?.from ?? today}
            selected={value?.from ? { from: value.from, to: value.to } : undefined}
            onSelect={(next) => onChange({ from: next?.from, to: next?.to })}
            disabled={disabled}
          />
        ) : (
          <Calendar
            mode="single"
            required={false}
            numberOfMonths={numberOfMonths}
            defaultMonth={value?.from ?? today}
            selected={value?.from}
            onSelect={(next) => onChange({ from: next ?? undefined, to: next ?? undefined })}
            disabled={disabled}
          />
        )}

        {/* Echoes back what's actually selected — with presets in play it isn't obvious from the
            grid alone which dates "Last 30 days" resolved to. */}
        <div className="flex min-h-[var(--space-32)] items-center border-t border-[var(--color-table-border)] px-[var(--space-12)] py-[var(--space-8)]">
          <span
            data-testid="date-range-summary"
            className="text-[length:var(--text-body-3-size)] text-muted-foreground"
          >
            {value?.from ? formatDateRange(value) : 'No date selected'}
          </span>
        </div>
      </div>
    </div>
  )
}
