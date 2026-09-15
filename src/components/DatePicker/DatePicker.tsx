import { useId, useState } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePanel } from './DateRangePanel'
import { formatDate, formatDateRange } from '@/lib/date'
import type { DatePreset, DateRangeValue } from '@/lib/date'

export type DatePickerSize = 'sm' | 'md'

export type DatePickerProps = {
  /** `'single'` picks one day; `'range'` picks two and shows the preset sidebar. */
  mode?: 'single' | 'range'
  value?: DateRangeValue
  /** Fires when the user presses Apply in the panel, or clears the field. */
  onChange?: (value: DateRangeValue) => void
  placeholder?: string
  presets?: DatePreset[]
  today?: Date
  minDate?: Date
  maxDate?: Date
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6

  label?: string
  accessibilityLabel?: string
  necessityIndicator?: 'required' | 'optional' | 'none'
  helpText?: string
  errorText?: string

  isDisabled?: boolean
  isRequired?: boolean
  showClearButton?: boolean
  size?: DatePickerSize
  className?: string
}

const SIZE_PADDING: Record<DatePickerSize, string> = {
  sm: 'py-[var(--space-4)] px-[var(--space-8)]',
  // Figma's 34px field: 6 + 20 + 6 + 2, with 16px side padding — see BaseInput.tsx.
  md: 'py-[6px] px-[var(--space-16)]',
}

const SIZE_TEXT: Record<DatePickerSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
}

/** A form field for picking a date, with the same anatomy as Combobox (label, hint, error). Dates
 * are chosen in the panel — by clicking the grid or typing DD / MM / YYYY — and committed with Apply. */
export function DatePicker({
  mode = 'single',
  value,
  onChange,
  placeholder = 'Select date',
  presets,
  today = new Date(),
  minDate,
  maxDate,
  weekStartsOn,
  label,
  accessibilityLabel,
  necessityIndicator = 'none',
  helpText,
  errorText,
  isDisabled = false,
  isRequired = false,
  showClearButton = false,
  size = 'md',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const baseId = useId()
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`

  const hintText = errorText ?? helpText
  const display = value?.from ? (mode === 'range' ? formatDateRange(value) : formatDate(value.from)) : ''
  const canClear = showClearButton && Boolean(value?.from) && !isDisabled

  return (
    <div
      className={cn(
        'flex flex-col gap-[var(--space-4)] font-[family-name:var(--font-family-primary)]',
        // Figma dims the whole field — label, box and hint — when disabled.
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {label && (
        <span
          id={labelId}
          className="text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-medium text-[var(--color-text-secondary)]"
        >
          {/* Figma puts the required asterisk before the label. */}
          {necessityIndicator === 'required' && (
            <span className="text-[var(--color-input-error)]" aria-hidden="true">
              *
            </span>
          )}
          {label}
          {necessityIndicator === 'optional' && (
            <span className="text-[length:var(--text-label-3-size)] font-normal text-muted-foreground"> (optional)</span>
          )}
        </span>
      )}

      <Popover open={open} onOpenChange={(next) => !isDisabled && setOpen(next)}>
        <div className="relative">
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              aria-label={label ? undefined : accessibilityLabel}
              aria-labelledby={label ? labelId : undefined}
              aria-required={isRequired || undefined}
              aria-invalid={errorText ? true : undefined}
              aria-describedby={hintText ? hintId : undefined}
              className={cn(
                'flex w-full items-center gap-[var(--space-8)] box-border text-left',
                // `no-inner-focus-ring` swaps the global outline for Figma's field ring below.
                'bg-card border rounded-[var(--radius-6)] shadow-[var(--shadow-input)] cursor-pointer no-inner-focus-ring',
                'transition-[border-color,box-shadow] duration-150 ease-in-out',
                SIZE_PADDING[size],
                SIZE_TEXT[size],
                // Figma: a red-600 border for errors; otherwise the primary border inside a 2px ring
                // while focused from the keyboard or open.
                errorText
                  ? 'border-[var(--color-input-error)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-input-error)_25%,transparent)]'
                  : cn(
                      'border-input hover:border-[var(--color-input-border-hover)]',
                      'focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)]',
                      'data-[state=open]:border-[var(--color-primary)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--color-input-focus-ring)]',
                    ),
                isDisabled && 'cursor-not-allowed',
                canClear && 'pr-[var(--space-40)]',
              )}
            >
              <CalendarIcon size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className={cn('truncate', !display && 'text-muted-foreground')}>{display || placeholder}</span>
            </button>
          </PopoverTrigger>

          {/* Overlaid rather than nested: a <button> can't legally contain another. */}
          {canClear && (
            <button
              type="button"
              aria-label="Clear date"
              onClick={() => onChange?.({})}
              className="absolute right-[var(--space-16)] top-1/2 -translate-y-1/2 cursor-pointer rounded-[var(--radius-4)] border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <PopoverContent align="start" className="w-auto border-[var(--color-border)] p-0">
          <DateRangePanel
            mode={mode}
            value={value}
            onApply={(next) => {
              onChange?.(next)
              setOpen(false)
            }}
            presets={presets}
            today={today}
            minDate={minDate}
            maxDate={maxDate}
            weekStartsOn={weekStartsOn}
          />
        </PopoverContent>
      </Popover>

      {hintText && (
        <p
          id={hintId}
          className={cn(
            'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)]',
            errorText ? 'text-[var(--color-input-error)]' : 'text-muted-foreground',
          )}
        >
          {hintText}
        </p>
      )}
    </div>
  )
}
