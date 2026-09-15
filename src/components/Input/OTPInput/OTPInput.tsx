import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent, ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// Reference: Razorpay Blade's OTPInput
// https://github.com/razorpay/blade/tree/master/packages/blade/src/components/Input/OTPInput
// Two deliberate departures from Blade, documented since they're not just literal ports:
// - Digits only (Blade accepts any pasted character) — an OTP is a numeric code in the
//   overwhelming majority of real cases, and every box already sets inputMode="numeric".
// - Masked digits reveal briefly before hiding (Blade masks immediately on entry) — matches the
//   native iOS/Android SMS-autofill pattern, a well-established, more polished UX for this
//   specific field type.

export type OTPInputLength = 4 | 6 | 8
export type OTPInputSize = 'sm' | 'md'
export type OTPInputValidationState = 'none' | 'error' | 'success'

export type OTPInputProps = {
  id?: string
  name?: string
  /** Required (by convention) when `label` is omitted. */
  accessibilityLabel?: string

  label?: string
  /** Rendered right after the label text, e.g. an info-tooltip trigger. */
  labelSuffix?: ReactNode
  /** Rendered right-aligned on the label row, e.g. a "Resend code" link. */
  labelTrailing?: ReactNode
  necessityIndicator?: 'required' | 'optional' | 'none'
  hideLabelText?: boolean

  length?: OTPInputLength
  isMasked?: boolean
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Fires once, when every box has a digit. */
  onComplete?: (value: string) => void
  autoFocus?: boolean

  size?: OTPInputSize
  validationState?: OTPInputValidationState
  errorText?: string
  successText?: string
  helpText?: string

  isDisabled?: boolean
  isRequired?: boolean
  className?: string
}

// 80x36 for md — width is a fixed one-off (no matching --space-* token for 80px), height matches
// this project's established md control height (Button/TextInput: 8+20+8=36px) so an OTP field
// sits flush next to a button or text input in the same row. sm scales the same way (32px height
// matches Button/TextInput's sm height) with a proportionally narrower box.
const BOX_SIZE: Record<OTPInputSize, string> = {
  sm: 'w-[64px] h-[var(--space-32)] text-[length:var(--text-label-2-size)]',
  md: 'w-[80px] h-[36px] text-[length:var(--text-label-1-size)]',
}

const VALIDATION_RING: Record<OTPInputValidationState, string> = {
  none: '',
  error: 'border-[var(--color-input-error)]',
  success: 'border-success',
}
// Plain conditional class (not `focus:`) — see BaseInput.tsx for why: Tailwind v4 wraps variant
// pseudo-classes in `:where()`, zeroing their specificity against plain utility classes here.
// Matches the Figma field focus: the primary border inside a 2px blue-200 ring.
const FOCUS_RING = 'border-[var(--color-primary)] ring-2 ring-[var(--color-input-focus-ring)]'

const VALIDATION_ICON: Record<OTPInputValidationState, typeof CircleAlert | null> = {
  none: null,
  error: CircleAlert,
  success: CircleCheck,
}

const REVEAL_DURATION_MS = 500

function splitValue(source: string | undefined, length: number): string[] {
  return Array.from({ length }, (_, i) => source?.[i] ?? '')
}

export const OTPInput = forwardRef<(HTMLInputElement | null)[], OTPInputProps>(
  (
    {
      id,
      name,
      accessibilityLabel,
      label,
      labelSuffix,
      labelTrailing,
      necessityIndicator = 'none',
      hideLabelText = false,
      length = 6,
      isMasked = false,
      value,
      defaultValue,
      onChange,
      onComplete,
      autoFocus,
      size = 'md',
      validationState,
      errorText,
      successText,
      helpText,
      isDisabled = false,
      isRequired = false,
      className,
    },
    ref,
  ) => {
    const generatedId = useId()
    const groupId = id ?? generatedId
    const hintId = `${groupId}-hint`
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const revealTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const completedRef = useRef(false)

    const [digits, setDigits] = useState<string[]>(() => splitValue(value ?? defaultValue, length))
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const [revealedIndex, setRevealedIndex] = useState<number | null>(null)

    useImperativeHandle(ref, () => inputRefs.current, [])

    // Re-sync from the controlling value when it changes externally (e.g. a parent clearing it).
    useEffect(() => {
      if (value !== undefined) setDigits(splitValue(value, length))
    }, [value, length])

    const resolvedValidationState: OTPInputValidationState =
      validationState ?? (errorText ? 'error' : successText ? 'success' : 'none')
    const hintText = errorText ?? successText ?? helpText
    const ValidationIcon = VALIDATION_ICON[resolvedValidationState]

    function commit(next: string[]) {
      setDigits(next)
      const joined = next.join('')
      onChange?.(joined)
      const filled = next.every((d) => d !== '')
      if (filled && !completedRef.current) {
        completedRef.current = true
        onComplete?.(joined)
      } else if (!filled) {
        completedRef.current = false
      }
    }

    function applyValue(startIndex: number, rawText: string) {
      const clean = rawText.replace(/[^0-9]/g, '')
      if (!clean) return
      const next = [...digits]
      let i = startIndex
      for (const char of clean) {
        if (i >= length) break
        next[i] = char
        i++
      }
      commit(next)

      if (isMasked && clean.length === 1) {
        setRevealedIndex(startIndex)
        clearTimeout(revealTimer.current)
        revealTimer.current = setTimeout(() => setRevealedIndex(null), REVEAL_DURATION_MS)
      }

      const focusIndex = Math.min(i, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }

    function handleChange(index: number) {
      return (event: ChangeEvent<HTMLInputElement>) => {
        applyValue(index, event.target.value)
      }
    }

    function handlePaste(index: number) {
      return (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault()
        applyValue(index, event.clipboardData.getData('text'))
      }
    }

    function handleKeyDown(index: number) {
      return (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace') {
          event.preventDefault()
          if (digits[index]) {
            const next = [...digits]
            next[index] = ''
            commit(next)
          } else if (index > 0) {
            const next = [...digits]
            next[index - 1] = ''
            commit(next)
            inputRefs.current[index - 1]?.focus()
          }
        } else if (event.key === 'ArrowLeft' && index > 0) {
          event.preventDefault()
          inputRefs.current[index - 1]?.focus()
        } else if (event.key === 'ArrowRight' && index < length - 1) {
          event.preventDefault()
          inputRefs.current[index + 1]?.focus()
        }
      }
    }

    return (
      <div
        className={cn(
          'flex flex-col gap-[var(--space-4)] font-[family-name:var(--font-family-primary)]',
          // Figma dims the whole field — label, boxes and hint — when disabled.
          isDisabled && 'opacity-50',
          className,
        )}
      >
        {label && (
          <div className="flex items-center justify-between gap-[var(--space-8)]">
            <div className="flex items-center gap-[var(--space-4)]">
              <span
                id={`${groupId}-label`}
                className={cn(
                  'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-medium text-[var(--color-text-secondary)]',
                  hideLabelText && 'sr-only',
                )}
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
              {labelSuffix}
            </div>
            {labelTrailing}
          </div>
        )}

        <div role="group" aria-labelledby={label ? `${groupId}-label` : undefined} className="flex gap-[var(--space-8)]">
          {digits.map((digit, index) => {
            const isRevealed = revealedIndex === index
            const showAsPassword = isMasked && digit !== '' && !isRevealed
            return (
              <input
                key={index}
                ref={(node) => {
                  inputRefs.current[index] = node
                }}
                id={index === 0 ? groupId : undefined}
                name={index === 0 ? name : undefined}
                type={showAsPassword ? 'password' : 'text'}
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                disabled={isDisabled}
                required={isRequired && index === 0}
                autoFocus={autoFocus && index === 0}
                onChange={handleChange(index)}
                onPaste={handlePaste(index)}
                onKeyDown={handleKeyDown(index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
                aria-label={!label ? `${accessibilityLabel ?? 'One-time code'}, digit ${index + 1} of ${length}` : undefined}
                aria-invalid={resolvedValidationState === 'error' || undefined}
                aria-describedby={hintText ? hintId : undefined}
                className={cn(
                  '[--border:var(--field-border,var(--color-input-border))]',
                  'box-border rounded-[var(--radius-6)] border bg-card text-center font-medium text-foreground shadow-[var(--shadow-input)] outline-none',
                  'transition-[border-color,background-color,box-shadow] duration-150 ease-in-out',
                  BOX_SIZE[size],
                  VALIDATION_RING[resolvedValidationState],
                  resolvedValidationState === 'none' && focusedIndex === index && FOCUS_RING,
                  isDisabled
                    ? 'cursor-not-allowed'
                    : resolvedValidationState === 'none' &&
                        focusedIndex !== index &&
                        'hover:border-[var(--color-input-border-hover)]',
                )}
              />
            )
          })}
        </div>

        {hintText && (
          <p
            id={hintId}
            className={cn(
              'm-0 flex items-center gap-[var(--space-4)] text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground',
              resolvedValidationState === 'error' && 'text-[var(--color-input-error)]',
              resolvedValidationState === 'success' && 'text-success',
            )}
          >
            {ValidationIcon && <ValidationIcon size={14} />}
            {hintText}
          </p>
        )}
      </div>
    )
  },
)

OTPInput.displayName = 'OTPInput'
