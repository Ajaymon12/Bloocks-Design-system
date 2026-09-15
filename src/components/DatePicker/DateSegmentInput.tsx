import { Fragment, forwardRef, useId, useRef, useState } from 'react'
import type { ClipboardEvent, ForwardedRef, KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, isOutsideBounds, parseDateParts, toDateParts } from '@/lib/date'
import type { DateParts } from '@/lib/date'

export type DateSegmentStatus = 'empty' | 'incomplete' | 'invalid' | 'valid'

export type DateSegmentInputProps = {
  label: string
  value?: Date
  /** Reports a date only once all three segments form a real, in-bounds date; otherwise `undefined`
   * with a status saying why, so the parent can hold Apply until the field is finished. */
  onChange: (date: Date | undefined, status: DateSegmentStatus) => void
  minDate?: Date
  maxDate?: Date
  /** An error only the parent can know about, e.g. "To" falling before "From". */
  error?: string
  className?: string
}

type Segment = keyof DateParts

const ORDER: Segment[] = ['day', 'month', 'year']
const MAX_LENGTH: Record<Segment, number> = { day: 2, month: 2, year: 4 }
const PLACEHOLDER: Record<Segment, string> = { day: 'DD', month: 'MM', year: 'YYYY' }

/** Accepts the shapes people actually paste: 12/08/2026, 12-08-2026, 12.08.2026 and ISO 2026-08-12. */
function parsePasted(text: string): DateParts | null {
  const trimmed = text.trim()
  const dayFirst = trimmed.match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/)
  if (dayFirst) return { day: dayFirst[1].padStart(2, '0'), month: dayFirst[2].padStart(2, '0'), year: dayFirst[3] }
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return { day: iso[3].padStart(2, '0'), month: iso[2].padStart(2, '0'), year: iso[1] }
  return null
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value)
  else if (ref) ref.current = value
}

/** A date typed as three numeric segments — DD / MM / YYYY — with focus moving forward on its own
 * as each segment fills. The forwarded ref points at the day segment, so a parent can focus it. */
export const DateSegmentInput = forwardRef<HTMLInputElement, DateSegmentInputProps>(function DateSegmentInput(
  { label, value, onChange, minDate, maxDate, error, className },
  ref,
) {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const errorId = `${baseId}-error`
  const segmentRefs = useRef<Partial<Record<Segment, HTMLInputElement | null>>>({})

  const [parts, setParts] = useState<DateParts>(() => toDateParts(value))
  const [localError, setLocalError] = useState<string | undefined>()
  // JS-tracked, like BaseInput: Tailwind v4's `focus-within:` variant loses to plain utilities.
  const [isFocused, setIsFocused] = useState(false)

  // Resync when the date changes from OUTSIDE (a calendar click, a preset, Reset). Done while
  // rendering rather than in an effect. `syncedKey` is also updated whenever this field reports a
  // change itself, so the parent echoing that change back never wipes digits still being typed.
  const valueKey = value ? value.getTime() : null
  const [syncedKey, setSyncedKey] = useState(valueKey)
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey)
    setParts(toDateParts(value))
    setLocalError(undefined)
  }

  function commit(next: DateParts) {
    setParts(next)
    const result = parseDateParts(next)

    if (result.status === 'valid') {
      if (isOutsideBounds(result.date, minDate, maxDate)) {
        const tooLate = Boolean(maxDate) && isOutsideBounds(result.date, undefined, maxDate)
        setLocalError(
          tooLate
            ? `Must be on or before ${formatDate(maxDate as Date)}`
            : `Must be on or after ${formatDate(minDate as Date)}`,
        )
        setSyncedKey(null)
        onChange(undefined, 'invalid')
        return
      }
      setLocalError(undefined)
      setSyncedKey(result.date.getTime())
      onChange(result.date, 'valid')
      return
    }

    setLocalError(result.status === 'invalid' ? 'Not a valid date' : undefined)
    setSyncedKey(null)
    onChange(undefined, result.status)
  }

  function focusSegment(segment: Segment | undefined, caret: 'select' | 'start' | 'end') {
    const element = segment ? segmentRefs.current[segment] : null
    if (!element) return
    element.focus()
    if (caret === 'select') element.select()
    else {
      const position = caret === 'start' ? 0 : element.value.length
      element.setSelectionRange(position, position)
    }
  }

  function neighbour(segment: Segment, direction: 1 | -1): Segment | undefined {
    return ORDER[ORDER.indexOf(segment) + direction]
  }

  function handleInput(segment: Segment, raw: string) {
    let digits = raw.replace(/\D/g, '').slice(0, MAX_LENGTH[segment])
    let advance = digits.length === MAX_LENGTH[segment]
    // A first digit that can't begin a two-digit day (4–9) or month (2–9) is already a whole value.
    const single = digits.length === 1 ? Number(digits) : null
    if (single !== null && ((segment === 'day' && single > 3) || (segment === 'month' && single > 1))) {
      digits = `0${digits}`
      advance = true
    }
    commit({ ...parts, [segment]: digits })
    if (advance) focusSegment(neighbour(segment, 1), 'select')
  }

  function handleKeyDown(segment: Segment, event: KeyboardEvent<HTMLInputElement>) {
    const element = event.currentTarget
    const previous = neighbour(segment, -1)
    const next = neighbour(segment, 1)

    if (event.key === 'Backspace' && element.value === '' && previous) {
      event.preventDefault()
      focusSegment(previous, 'end')
    } else if (event.key === 'ArrowLeft' && element.selectionStart === 0 && element.selectionEnd === 0 && previous) {
      event.preventDefault()
      focusSegment(previous, 'end')
    } else if (event.key === 'ArrowRight' && element.selectionStart === element.value.length && next) {
      event.preventDefault()
      focusSegment(next, 'start')
    } else if (event.key === '/' || event.key === '.' || event.key === '-') {
      // Typing the separator is a natural way to say "done with this segment".
      event.preventDefault()
      if (next && element.value) {
        if (element.value.length === 1 && segment !== 'year') commit({ ...parts, [segment]: element.value.padStart(2, '0') })
        focusSegment(next, 'select')
      }
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const parsed = parsePasted(event.clipboardData.getData('text'))
    if (!parsed) return
    event.preventDefault()
    commit(parsed)
    focusSegment('year', 'end')
  }

  function handleGroupBlur() {
    setIsFocused(false)
    const result = parseDateParts(parts)
    // Tidy "5/9/2026" into "05/09/2026" once the user has moved on.
    if (result.status === 'valid') setParts(toDateParts(result.date))
    // Only complain about a half-typed date after they've left it, never mid-keystroke.
    if (result.status === 'incomplete') setLocalError('Enter a complete date')
  }

  const shownError = error ?? localError
  const isEmpty = ORDER.every((segment) => !parts[segment])

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-[var(--space-4)]', className)}>
      <span
        id={labelId}
        className="text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-medium text-foreground"
      >
        {label}
      </span>

      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={shownError ? errorId : undefined}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          // Moving between this field's own segments is not leaving the field.
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) handleGroupBlur()
        }}
        onMouseDown={(event) => {
          // Clicking the padding or a separator lands in the first empty segment.
          if (event.target instanceof HTMLInputElement) return
          event.preventDefault()
          focusSegment(ORDER.find((segment) => !parts[segment]) ?? 'day', 'select')
        }}
        // Same frame as Select's `sm` field, so the From/To fields line up with the preset dropdown.
        className={cn(
          '[--border:var(--field-border,var(--color-input-border))]',
          'flex w-full cursor-text items-center gap-[var(--space-8)] box-border bg-card border rounded-[var(--radius-6)] shadow-[var(--shadow-input)]',
          'px-[var(--space-8)] py-[var(--space-4)] transition-[border-color,box-shadow] duration-150 ease-in-out',
          shownError
            ? 'border-[var(--color-input-error)]'
            : isFocused
              ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-input-focus-ring)]'
              : 'hover:border-[var(--color-input-border-hover)]',
        )}
      >
        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
        {/* At rest, an empty field shows one "dd/mm/yyyy" hint that truncates like Figma's, rather
            than three per-segment placeholders too wide for a half-width field. Focus reveals the
            segments. */}
        {isEmpty && !isFocused && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-muted-foreground"
          >
            dd/mm/yyyy
          </span>
        )}
        {ORDER.map((segment, index) => (
          <Fragment key={segment}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'px-[var(--space-1)] text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-muted-foreground',
                  isEmpty && !isFocused && 'opacity-0',
                )}
              >
                /
              </span>
            )}
            <input
              ref={(element) => {
                segmentRefs.current[segment] = element
                if (segment === 'day') assignRef(ref, element)
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={MAX_LENGTH[segment]}
              placeholder={PLACEHOLDER[segment]}
              aria-label={`${label}, ${segment}`}
              aria-invalid={shownError ? true : undefined}
              value={parts[segment]}
              onChange={(event) => handleInput(segment, event.target.value)}
              onKeyDown={(event) => handleKeyDown(segment, event)}
              // Select on focus so typing replaces a filled segment instead of being cut off by maxLength.
              onFocus={(event) => event.currentTarget.select()}
              onPaste={handlePaste}
              className={cn(
                'no-inner-focus-ring min-w-0 border-0 bg-transparent p-0 text-center tabular-nums outline-none',
                'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-foreground placeholder:text-muted-foreground',
                segment === 'year' ? 'w-[4.5ch]' : 'w-[2.5ch]',
                isEmpty && !isFocused && 'opacity-0',
              )}
            />
          </Fragment>
        ))}
        </div>
        <Calendar size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
      </div>

      {shownError && (
        <p id={errorId} className="text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-destructive">
          {shownError}
        </p>
      )}
    </div>
  )
})
