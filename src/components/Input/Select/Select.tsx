import { forwardRef, useId, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, Ref } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === 'function') ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

// A native <select>, not a custom combobox — accessible and robust (native keyboard nav, OS
// listbox rendering) without building type-ahead filtering/listbox ARIA from scratch. Reference:
// a Figma-exported "Type or Select" field the user shared — the label+info-icon+chevron+clear
// shape is carried over, but real type-to-filter behavior is out of scope (would need a real
// Combobox component; revisit if a real need comes up).

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectSize = 'sm' | 'md'
export type SelectValidationState = 'none' | 'error' | 'success'

export type SelectProps = {
  id?: string
  name?: string
  /** Required (by convention) when `label` is omitted. */
  accessibilityLabel?: string

  label?: string
  /** Shows an info icon next to the label with this text in a tooltip on hover/focus. */
  labelHint?: string
  necessityIndicator?: 'required' | 'optional' | 'none'
  hideLabelText?: boolean

  options: SelectOption[]
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  onFocus?: (event: FocusEvent<HTMLSelectElement>) => void
  onBlur?: (event: FocusEvent<HTMLSelectElement>) => void
  /** Shows a clear (×) button once a value is selected, resetting back to the placeholder. */
  showClearButton?: boolean
  onClearButtonClick?: () => void

  size?: SelectSize
  validationState?: SelectValidationState
  errorText?: string
  successText?: string
  helpText?: string

  isDisabled?: boolean
  isRequired?: boolean
  className?: string
}

const SIZE_PADDING: Record<SelectSize, string> = {
  sm: 'py-[var(--space-4)] px-[var(--space-8)]',
  // Figma's 34px field: 6 + 20 + 6 + 2, with 16px side padding — see BaseInput.tsx.
  md: 'py-[6px] px-[var(--space-16)]',
}

const SIZE_TEXT: Record<SelectSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
}

const VALIDATION_RING: Record<SelectValidationState, string> = {
  none: '',
  error: 'border-[var(--color-input-error)]',
  success: 'border-success',
}
// Plain conditional class (not `focus:`) — see BaseInput.tsx for why: Tailwind v4 wraps variant
// pseudo-classes in `:where()`, zeroing their specificity against plain utility classes here.
const FOCUS_RING = 'border-[var(--color-primary)] ring-2 ring-[var(--color-input-focus-ring)]'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      name,
      accessibilityLabel,
      label,
      labelHint,
      necessityIndicator = 'none',
      hideLabelText = false,
      options,
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      showClearButton = false,
      onClearButtonClick,
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
    const selectId = id ?? generatedId
    const hintId = `${selectId}-hint`
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [hintOpen, setHintOpen] = useState(false)

    const resolvedValidationState: SelectValidationState =
      validationState ?? (errorText ? 'error' : successText ? 'success' : 'none')
    const hintText = errorText ?? successText ?? helpText
    const hasValue = Boolean(value ?? defaultValue)
    const canClear = showClearButton && hasValue && !isDisabled

    const handleClear = () => {
      onClearButtonClick?.()
      if (value === undefined) {
        // Uncontrolled: mutate the DOM value directly (via the native setter, so React's
        // change-event listener still fires) — mirrors BaseInput's clear-button handling.
        const node = innerRef.current
        if (node) {
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')?.set
          setter?.call(node, '')
          node.dispatchEvent(new Event('change', { bubbles: true }))
        }
      } else if (!onClearButtonClick) {
        onChange?.({ target: { value: '' } } as ChangeEvent<HTMLSelectElement>)
      }
    }

    const wrapperClasses = cn(
      // No explicit `border-border` — see BaseInput.tsx for why (global @layer base reset
      // supplies the resting color; a plain utility class here would beat the JS-tracked ring).
      '[--border:var(--field-border,var(--color-input-border))]',
      'relative flex items-center gap-[var(--space-8)] w-full box-border bg-card border rounded-[var(--radius-6)] shadow-[var(--shadow-input)]',
      'transition-[border-color,background-color,box-shadow] duration-150 ease-in-out',
      SIZE_PADDING[size],
      VALIDATION_RING[resolvedValidationState],
      resolvedValidationState === 'none' && isFocused && FOCUS_RING,
      isDisabled
        ? 'cursor-not-allowed'
        : resolvedValidationState === 'none' && !isFocused && 'hover:border-[var(--color-input-border-hover)]',
    )

    // Reserve space on the right for chevron + optional clear button, so the native <select>'s
    // own text never renders underneath them.
    const trailingReserve = canClear ? 'pr-[var(--space-48)]' : 'pr-[var(--space-24)]'

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
          <div className="flex items-center gap-[var(--space-4)]">
            <label
              htmlFor={selectId}
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
            </label>
            {labelHint && (
              <span className="relative inline-flex">
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={labelHint}
                  className="inline-flex text-muted-foreground hover:text-foreground"
                  onMouseEnter={() => setHintOpen(true)}
                  onMouseLeave={() => setHintOpen(false)}
                  onFocus={() => setHintOpen(true)}
                  onBlur={() => setHintOpen(false)}
                >
                  <Info size={10} />
                </button>
                {hintOpen && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-[var(--space-4)] -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-4)] bg-foreground px-[var(--space-8)] py-[var(--space-4)] text-[length:var(--text-body-3-size)] text-background shadow-md"
                  >
                    {labelHint}
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        <div className={wrapperClasses}>
          <select
            ref={mergeRefs(ref, innerRef)}
            id={selectId}
            name={name}
            // `no-inner-focus-ring` — see BaseInput.tsx for why: the wrapper already shows a
            // custom ring on focus, so the browser's own outline on this inner element would
            // draw a second, smaller box inset inside it.
            className={cn(
              'flex-1 min-w-0 appearance-none border-0 outline-none bg-transparent text-foreground cursor-pointer no-inner-focus-ring',
              'font-[family-name:var(--font-family-primary)] disabled:cursor-not-allowed',
              !hasValue && 'text-muted-foreground',
              trailingReserve,
              SIZE_TEXT[size],
            )}
            value={value}
            // When uncontrolled with no defaultValue, default to '' explicitly — otherwise a
            // native <select> auto-selects the first *enabled* option (skipping our disabled
            // placeholder), so the placeholder would never actually show.
            defaultValue={value === undefined ? (defaultValue ?? '') : undefined}
            disabled={isDisabled}
            required={isRequired}
            onChange={onChange}
            onFocus={(event) => {
              setIsFocused(true)
              onFocus?.(event)
            }}
            onBlur={(event) => {
              setIsFocused(false)
              onBlur?.(event)
            }}
            aria-label={!label ? accessibilityLabel : undefined}
            aria-required={isRequired || undefined}
            aria-invalid={resolvedValidationState === 'error' || undefined}
            aria-describedby={hintText ? hintId : undefined}
          >
            {(placeholder || showClearButton) && (
              // Always present when clearable, even without placeholder text — otherwise
              // there's no empty-value <option> for a native <select> to fall back to, and
              // "clearing" silently does nothing (the browser can't select a value with no
              // matching option).
              <option value="" disabled hidden>
                {placeholder ?? ''}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-[var(--space-16)] top-1/2 flex -translate-y-1/2 items-center gap-[var(--space-8)]">
            {canClear && (
              <button
                type="button"
                className="pointer-events-auto inline-flex items-center justify-center p-0 border-0 bg-transparent text-muted-foreground cursor-pointer rounded-[var(--radius-4)] hover:text-foreground"
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X size={16} />
              </button>
            )}
            <span className="text-muted-foreground" aria-hidden="true">
              <ChevronDown size={16} />
            </span>
          </div>
        </div>

        {hintText && (
          <p
            id={hintId}
            className={cn(
              'm-0 text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground',
              resolvedValidationState === 'error' && 'text-[var(--color-input-error)]',
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

Select.displayName = 'Select'
