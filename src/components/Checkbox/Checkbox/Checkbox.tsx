import { forwardRef, useContext, useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode, Ref } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CheckboxGroupContext } from './CheckboxGroupContext'

// Reference: Razorpay Blade's Checkbox
// https://github.com/razorpay/blade/tree/master/packages/blade/src/components/Checkbox
// Deliberate departures from Blade, documented since they're not just literal ports:
// - No testID/analytics/styled-system spread props, no motion config — this project doesn't have
//   those systems (same scoping decision made for BaseInput/Select/OTPInput).
// - `onChange` is a plain `(event) => void` (read `event.target.checked`), not Blade's
//   `{ isChecked, event, value }` object — matches every other Input-family component here.
// - `validationState` includes `'success'` (Blade only has `'error'`/`'none'`) — matches
//   BaseInput/Select/OTPInput's 3-state convention.
// - The visual box is driven by JS-tracked React state, not Tailwind's `peer-checked:`/`focus:`
//   variants — this project has twice already hit real bugs from Tailwind v4 wrapping variant
//   pseudo-classes in `:where()`, zeroing their specificity against plain utility classes (see
//   BaseInput.tsx's `no-inner-focus-ring`). Not worth risking a third time.
// - A 3rd size, `lg`, was added on purpose — every other component here is sm/md-only; this is a
//   deliberate one-off for Checkbox, not a signal to retrofit the rest of the system.

export type CheckboxSize = 'sm' | 'md' | 'lg'
export type CheckboxValidationState = 'none' | 'error' | 'success'

export type CheckboxProps = {
  /** Label content. Accepts rich content (e.g. a link), not just plain text. */
  children?: ReactNode

  /** Checked state. Providing this makes the checkbox controlled — you own updating it via
   * `onChange`. Ignored (the group's own state wins) when this checkbox has a `value` and is
   * rendered inside a `CheckboxGroup`. */
  isChecked?: boolean
  /** Initial checked state for uncontrolled usage. Ignored once `isChecked` is provided. */
  defaultChecked?: boolean
  /** Shows the dash/indeterminate glyph instead of the checkmark. Purely visual — it does not
   * change `isChecked`/the underlying value; typically used for a "select all" checkbox whose
   * indeterminate-vs-checked-vs-unchecked state you compute yourself from a list of children. */
  isIndeterminate?: boolean

  /** Disables the checkbox and dims it. When rendered inside a `CheckboxGroup`, defaults to the
   * group's own `isDisabled` if not set here directly. */
  isDisabled?: boolean
  /** Marks the underlying `<input>` as `required` for native HTML form validation. */
  isRequired?: boolean

  /** Box + label size. Defaults to the group's `size` when inside a `CheckboxGroup`, else `'md'`.
   * sm = 16px, md = 20px, lg = 24px (mapped to this project's `--space-16/20/24` tokens). */
  size?: CheckboxSize
  /** Visual validation state. Inferred automatically from `errorText`/`successText` when not set
   * explicitly — you rarely need to pass this yourself. */
  validationState?: CheckboxValidationState
  /** Neutral supporting text shown below the checkbox, when there's no error/success text. */
  helpText?: string
  /** Error message. Setting this also switches `validationState` to `'error'` unless overridden. */
  errorText?: string
  /** Success message. Setting this also switches `validationState` to `'success'` unless
   * overridden. */
  successText?: string

  /** Required (by convention) when this checkbox is a member of a `CheckboxGroup` — it's how the
   * group identifies which of its checkboxes are checked. Also used as the native `<input>`'s
   * form-submission value when set. */
  value?: string
  /** Name attribute for native form submission. */
  name?: string
  id?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  className?: string
}

const BOX_SIZE: Record<CheckboxSize, string> = {
  sm: 'w-[var(--space-16)] h-[var(--space-16)]',
  md: 'w-[var(--space-20)] h-[var(--space-20)]',
  lg: 'w-[var(--space-24)] h-[var(--space-24)]',
}

const ICON_SIZE: Record<CheckboxSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
}

const LABEL_TEXT: Record<CheckboxSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)]',
  lg: 'text-[length:var(--text-body-1-size)] leading-[var(--text-body-1-line-height)]',
}

// Plain conditional classes (JS-tracked state), not `focus:`/`peer-checked:` variants — see the
// header comment for why. Ring pattern matches BaseInput/Select/OTPInput's FOCUS_RING exactly.
const FOCUS_RING = 'border-[var(--color-primary)] ring-[3px] ring-primary/15'
const VALIDATION_RING: Record<CheckboxValidationState, string> = {
  none: '',
  error: 'border-destructive ring-[3px] ring-destructive/10',
  success: 'border-success ring-[3px] ring-success/10',
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      children,
      isChecked,
      defaultChecked,
      isIndeterminate = false,
      isDisabled,
      isRequired = false,
      size,
      validationState,
      helpText,
      errorText,
      successText,
      value,
      name,
      id,
      onChange,
      className,
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = `${inputId}-hint`
    const innerRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    const group = useContext(CheckboxGroupContext)
    const inGroup = group !== undefined && value !== undefined
    const resolvedSize = size ?? group?.size ?? 'md'
    const resolvedIsDisabled = isDisabled ?? group?.isDisabled ?? false
    const resolvedIsChecked = inGroup ? group.values.includes(value) : isChecked

    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = isIndeterminate
    }, [isIndeterminate])

    const resolvedValidationState: CheckboxValidationState =
      validationState ?? (errorText ? 'error' : successText ? 'success' : 'none')
    const hintText = errorText ?? successText ?? helpText

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (inGroup) group.toggleValue(value, event.target.checked)
      onChange?.(event)
    }

    const showCheck = resolvedIsChecked && !isIndeterminate
    const showDash = isIndeterminate
    const filled = showCheck || showDash

    return (
      <div className={cn('flex flex-col gap-[var(--space-4)]', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'inline-flex items-start gap-[var(--space-8)] font-[family-name:var(--font-family-primary)]',
            resolvedIsDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <span className={cn('relative inline-flex shrink-0', BOX_SIZE[resolvedSize])}>
            <input
              ref={mergeRefs(ref, innerRef)}
              id={inputId}
              type="checkbox"
              name={name}
              value={value}
              checked={inGroup ? resolvedIsChecked : isChecked}
              defaultChecked={inGroup || isChecked !== undefined ? undefined : defaultChecked}
              disabled={resolvedIsDisabled}
              required={isRequired}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-invalid={resolvedValidationState === 'error' || undefined}
              aria-describedby={hintText ? hintId : undefined}
              // Visually hidden but still present, focusable, and clickable (absolutely
              // positioned over the visible box below) — full native checkbox semantics.
              className="absolute inset-0 z-10 m-0 cursor-[inherit] opacity-0"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex items-center justify-center rounded-[var(--radius-4)] border bg-card text-white shadow-xs',
                'transition-[border-color,background-color,box-shadow] duration-150 ease-in-out',
                BOX_SIZE[resolvedSize],
                filled && 'border-primary bg-primary',
                VALIDATION_RING[resolvedValidationState],
                resolvedValidationState === 'none' && isFocused && FOCUS_RING,
                resolvedIsDisabled
                  ? 'opacity-50 shadow-none'
                  : !isFocused && !filled && 'hover:border-[var(--color-border-strong)]',
              )}
            >
              {showDash && <Minus size={ICON_SIZE[resolvedSize]} strokeWidth={3} />}
              {showCheck && <Check size={ICON_SIZE[resolvedSize]} strokeWidth={3} />}
            </span>
          </span>

          {children && (
            <span
              className={cn(
                LABEL_TEXT[resolvedSize],
                'text-foreground',
                resolvedIsDisabled && 'opacity-50',
              )}
            >
              {children}
            </span>
          )}
        </label>

        {hintText && (
          <p
            id={hintId}
            className={cn(
              'm-0 text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-muted-foreground',
              resolvedValidationState === 'error' && 'text-destructive',
              resolvedValidationState === 'success' && 'text-success',
            )}
          >
            {hintText}
          </p>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
