import { forwardRef, useId, useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, KeyboardEvent, ClipboardEvent, ReactNode, Ref } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Info, Loader2, X } from 'lucide-react'
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

export type BaseInputSize = 'sm' | 'md'
export type BaseInputValidationState = 'none' | 'error' | 'success'
export type BaseInputNecessity = 'required' | 'optional' | 'none'

export type BaseInputProps = {
  id?: string
  name?: string
  /** Required (by convention) when `label` is omitted. */
  accessibilityLabel?: string

  label?: string
  labelPosition?: 'top' | 'left'
  necessityIndicator?: BaseInputNecessity
  /** Keeps the label in the accessibility tree but visually hides it. */
  hideLabelText?: boolean
  /** Shows an info icon next to the label with this text in a tooltip on hover/focus. */
  labelHint?: string

  as?: 'input' | 'textarea'
  type?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'search' | 'password'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onPaste?: (event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  autoFocus?: boolean
  /** Defaults to `'off'` so the browser's own autofill suggestions don't show up over ours
   * (e.g. a name/address suggestion popup). Override for real forms that want it, e.g.
   * `autoComplete="email"` or `"current-password"`. */
  autoComplete?: string
  /** `as="textarea"` only. */
  rows?: number

  size?: BaseInputSize

  /** Inferred from `errorText`/`successText` when omitted. */
  validationState?: BaseInputValidationState
  errorText?: string
  successText?: string
  helpText?: string
  /** Shows a live "n/max" counter in the hint footer. */
  maxCharacters?: number

  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /** e.g. "+91", "$" */
  prefix?: ReactNode
  suffix?: ReactNode
  /** e.g. the password show/hide toggle. */
  trailingButton?: ReactNode

  /** Shows a spinner in the trailing slot, taking priority over `trailingIcon`/clear button. */
  isLoading?: boolean
  /** Shows a clear (×) button in the trailing slot once there's a value. */
  showClearButton?: boolean
  onClearButtonClick?: () => void

  isDisabled?: boolean
  isRequired?: boolean

  className?: string
}

const SIZE_PADDING: Record<BaseInputSize, string> = {
  sm: 'py-[var(--space-4)] px-[var(--space-8)]',
  // Figma (AIA - Component Library, Input, node 8:135): a 34px field — 6 + 20 (body-3 line) + 6 +
  // 2 (border) — with 16px side padding.
  md: 'py-[6px] px-[var(--space-16)]',
}

const SIZE_TEXT: Record<BaseInputSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
}

// Figma: errors are a red-600 border with no glow; focus is the primary border inside a 2px
// blue-200 ring. Error/success stay visible at rest, not just on focus.
// Applied as plain conditional classes (JS-tracked focus state below), not the `focus-within:`
// variant — Tailwind v4 wraps variant pseudo-classes in `:where()`, zeroing their specificity, so
// they silently lost to any plain utility class with real specificity regardless of source order.
const VALIDATION_RING: Record<BaseInputValidationState, string> = {
  none: '',
  error: 'border-[var(--color-input-error)]',
  success: 'border-success',
}
const FOCUS_RING = 'border-[var(--color-primary)] ring-2 ring-[var(--color-input-focus-ring)]'

export const BaseInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, BaseInputProps>(
  (
    {
      id,
      name,
      accessibilityLabel,
      label,
      labelPosition = 'top',
      necessityIndicator = 'none',
      hideLabelText = false,
      labelHint,
      as = 'input',
      type = 'text',
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      onPaste,
      autoFocus,
      autoComplete = 'off',
      rows,
      size = 'md',
      validationState,
      errorText,
      successText,
      helpText,
      maxCharacters,
      leadingIcon,
      trailingIcon,
      prefix,
      suffix,
      trailingButton,
      isLoading = false,
      showClearButton = false,
      onClearButtonClick,
      isDisabled = false,
      isRequired = false,
      className,
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = `${inputId}-hint`
    const innerRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [hintOpen, setHintOpen] = useState(false)

    const resolvedValidationState: BaseInputValidationState =
      validationState ?? (errorText ? 'error' : successText ? 'success' : 'none')
    const hintText = errorText ?? successText ?? helpText
    const currentLength = (value ?? defaultValue ?? '').length
    const hasValue = currentLength > 0
    const canClear = showClearButton && hasValue && !isDisabled && !isLoading

    const handleClear = () => {
      onClearButtonClick?.()
      if (value === undefined) {
        // Uncontrolled: mutate the DOM value directly (via the native setter, so React's
        // change-event listener still fires) rather than trying to manage the value ourselves.
        const node = innerRef.current
        if (node) {
          const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')?.set
          setter?.call(node, '')
          node.dispatchEvent(new Event('input', { bubbles: true }))
          node.focus()
        }
      } else if (!onClearButtonClick) {
        onChange?.({ target: { value: '' } } as ChangeEvent<HTMLInputElement & HTMLTextAreaElement>)
      }
    }

    const fieldClasses = cn(
      'flex flex-col gap-[var(--space-4)] font-[family-name:var(--font-family-primary)]',
      labelPosition === 'left' && 'flex-row items-baseline gap-[var(--space-12)]',
      // Figma dims the whole field — label, box and hint — when disabled.
      isDisabled && 'opacity-50',
      className,
    )

    const wrapperClasses = cn(
      // No explicit `border-border` here on purpose: the global `@layer base { * { border-color } }`
      // reset in tailwind.css supplies the resting color instead — an earlier layer, so it loses
      // to any utilities-layer rule regardless of specificity. This matters because the focus ring
      // below is JS-tracked (see isFocused) rather than the `focus-within:` variant: Tailwind v4
      // wraps variant pseudo-classes in `:where()`, zeroing their specificity, so a plain
      // `border-border` utility class would otherwise beat it outright even while matching.
      // Setting the reset's `--border` variable (not a border color) keeps that precedence while
      // giving fields their lighter outline; a parent can quiet it further via `--field-border`.
      '[--border:var(--field-border,var(--color-input-border))]',
      'flex items-center gap-[var(--space-8)] w-full box-border bg-card border rounded-[var(--radius-6)] shadow-[var(--shadow-input)]',
      'transition-[border-color,background-color,box-shadow] duration-150 ease-in-out',
      SIZE_PADDING[size],
      VALIDATION_RING[resolvedValidationState],
      resolvedValidationState === 'none' && isFocused && FOCUS_RING,
      isDisabled
        ? 'cursor-not-allowed'
        : resolvedValidationState === 'none' && !isFocused && 'hover:border-[var(--color-input-border-hover)]',
    )

    const sharedProps = {
      id: inputId,
      name,
      // `no-inner-focus-ring`: suppresses the global :focus-visible outline (tokens.css) on this
      // inner element specifically — the wrapper around it already shows a custom ring on focus,
      // so the browser's own outline would draw a second, smaller box inset inside it.
      className: cn(
        'flex-1 min-w-0 border-0 outline-none bg-transparent text-foreground no-inner-focus-ring',
        'font-[family-name:var(--font-family-primary)] placeholder:text-muted-foreground disabled:cursor-not-allowed',
        SIZE_TEXT[size],
      ),
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus: (event: FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
        setIsFocused(true)
        onFocus?.(event)
      },
      onBlur: (event: FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => {
        setIsFocused(false)
        onBlur?.(event)
      },
      onKeyDown,
      onPaste,
      autoFocus,
      autoComplete,
      disabled: isDisabled,
      required: isRequired,
      'aria-label': !label ? accessibilityLabel : undefined,
      'aria-required': isRequired || undefined,
      'aria-invalid': resolvedValidationState === 'error' || undefined,
      'aria-describedby': hintText || maxCharacters ? hintId : undefined,
    }

    const control =
      as === 'textarea' ? (
        <textarea
          {...sharedProps}
          ref={mergeRefs(ref, innerRef) as Ref<HTMLTextAreaElement>}
          rows={rows ?? 3}
        />
      ) : (
        <input {...sharedProps} ref={mergeRefs(ref, innerRef) as Ref<HTMLInputElement>} type={type} />
      )

    // Priority for the trailing icon slot: loading spinner > clear button > caller's trailingIcon.
    // Validation isn't shown as an icon (Figma has none); the hint text below spells it out, so it
    // is never conveyed by color alone. `trailingButton` (e.g. a password toggle) is always shown.
    const trailingSlot = isLoading ? (
      <span className="inline-flex shrink-0 text-muted-foreground" aria-hidden="true">
        <Loader2 size={16} className="animate-[spin_0.6s_linear_infinite]" />
      </span>
    ) : canClear ? (
      <button
        type="button"
        className="inline-flex shrink-0 items-center justify-center p-0 border-0 bg-transparent text-muted-foreground cursor-pointer rounded-[var(--radius-4)] hover:text-foreground"
        onClick={handleClear}
        aria-label="Clear input"
      >
        <X size={16} />
      </button>
    ) : trailingIcon ? (
      <span className="inline-flex shrink-0 text-muted-foreground" aria-hidden="true">
        {trailingIcon}
      </span>
    ) : null

    return (
      <div className={fieldClasses}>
        {label && (
          <div className="flex items-center gap-[var(--space-4)]">
            <label
              htmlFor={inputId}
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
          {prefix && (
            <span className="shrink-0 text-[length:var(--text-body-3-size)] text-muted-foreground whitespace-nowrap">
              {prefix}
            </span>
          )}
          {leadingIcon && (
            <span className="inline-flex shrink-0 text-muted-foreground" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          {control}
          {trailingSlot}
          {suffix && (
            <span className="shrink-0 text-[length:var(--text-body-3-size)] text-muted-foreground whitespace-nowrap">
              {suffix}
            </span>
          )}
          {trailingButton}
        </div>

        {(hintText || maxCharacters) && (
          <div id={hintId} className="flex items-baseline justify-between gap-[var(--space-8)]">
            {hintText && (
              <p
                className={cn(
                  'm-0 text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground',
                  resolvedValidationState === 'error' && 'text-[var(--color-input-error)]',
                  resolvedValidationState === 'success' && 'text-success',
                )}
              >
                {hintText}
              </p>
            )}
            {maxCharacters && (
              <span className="shrink-0 text-[length:var(--text-body-4-size)] text-muted-foreground">
                {currentLength}/{maxCharacters}
              </span>
            )}
          </div>
        )}
      </div>
    )
  },
)

BaseInput.displayName = 'BaseInput'
