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
  onChange?: (value: DateRangeValue) => void
  placeholder?: string
  presets?: DatePreset[]
  today?: Date
  minDate?: Date
  maxDate?: Date

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
  md: 'py-[var(--space-8)] px-[var(--space-12)]',
}

const SIZE_TEXT: Record<DatePickerSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)]',
}

/** A form field for picking a date, with the same anatomy as Combobox (label, hint, error).
 * The trigger is read-only — typed date entry is a separate problem and is not built here. */
export function DatePicker({
  mode = 'single',
  value,
  onChange,
  placeholder = 'Select date',
  presets,
  today = new Date(),
  minDate,
  maxDate,
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
    <div className={cn('flex flex-col gap-[var(--space-4)] font-[family-name:var(--font-family-primary)]', className)}>
      {label && (
        <span
          id={labelId}
          className="text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] font-medium text-foreground"
        >
          {label}
          {necessityIndicator === 'required' && (
            <span className="text-[length:var(--text-label-3-size)] font-normal text-destructive" aria-hidden="true">
              {' '}
              *
            </span>
          )}
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
                'bg-card border rounded-[var(--radius-8)] shadow-xs cursor-pointer',
                'transition-[border-color,box-shadow] duration-150 ease-in-out',
                SIZE_PADDING[size],
                SIZE_TEXT[size],
                errorText ? 'border-destructive' : 'border-border hover:border-[var(--color-border-strong)]',
                isDisabled && 'bg-muted opacity-50 cursor-not-allowed shadow-none',
                canClear && 'pr-[var(--space-32)]',
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
              className="absolute right-[var(--space-12)] top-1/2 -translate-y-1/2 cursor-pointer rounded-[var(--radius-4)] border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <PopoverContent align="start" className="w-auto p-0">
          <DateRangePanel
            mode={mode}
            value={value}
            onChange={(next) => {
              onChange?.(next)
              // A single date is complete the moment it's clicked; a range needs both ends.
              if (mode === 'single' && next.from) setOpen(false)
            }}
            presets={presets}
            today={today}
            minDate={minDate}
            maxDate={maxDate}
          />
        </PopoverContent>
      </Popover>

      {hintText && (
        <p
          id={hintId}
          className={cn(
            'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)]',
            errorText ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {hintText}
        </p>
      )}
    </div>
  )
}
