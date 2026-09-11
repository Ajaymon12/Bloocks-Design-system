import { forwardRef, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CheckboxGroupContext } from '../Checkbox/CheckboxGroupContext'
import type { CheckboxSize, CheckboxValidationState } from '../Checkbox/Checkbox'

// Reference: Razorpay Blade's CheckboxGroup
// https://github.com/razorpay/blade/tree/master/packages/blade/src/components/Checkbox/CheckboxGroup
// Blade does NOT support a "select all" indeterminate pattern in the group itself — neither do
// we; it's demonstrated as a composition pattern in the WithSelectAll story instead (a standalone
// Checkbox, not a member of the group, with its indeterminate/checked state computed by the
// consumer from the group's own value array) rather than new API surface here.

export type CheckboxGroupProps = {
  /** `Checkbox` elements — each one that should participate in this group needs its own `value`
   * prop; the group tracks which values are checked. A `Checkbox` with no `value` renders inside
   * the group visually but isn't tracked (e.g. a "select all" checkbox — see `WithSelectAll`). */
  children: ReactNode
  label?: string
  /** `'top'` stacks the label above the checkboxes (default); `'left'` places it beside them. */
  labelPosition?: 'top' | 'left'
  necessityIndicator?: 'required' | 'optional' | 'none'
  /** `'vertical'` (default) stacks checkboxes in a column; `'horizontal'` flows them in a row. */
  orientation?: 'vertical' | 'horizontal'
  /** Default size for every `Checkbox` in the group — an individual Checkbox's own `size` prop
   * still wins. */
  size?: CheckboxSize
  /** Disables every checkbox in the group — an individual Checkbox's own `isDisabled` still wins. */
  isDisabled?: boolean
  isRequired?: boolean
  /** The checked values. Providing this makes the group controlled — you own updating it via
   * `onChange`. */
  value?: string[]
  /** Initial checked values for uncontrolled usage. Ignored once `value` is provided. */
  defaultValue?: string[]
  onChange?: (values: string[]) => void
  validationState?: CheckboxValidationState
  helpText?: string
  errorText?: string
  successText?: string
  name?: string
  className?: string
}

export const CheckboxGroup = forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(function CheckboxGroup(
  {
    children,
    label,
    labelPosition = 'top',
    necessityIndicator = 'none',
    orientation = 'vertical',
    size = 'md',
    isDisabled = false,
    isRequired = false,
    value,
    defaultValue,
    onChange,
    validationState,
    helpText,
    errorText,
    successText,
    name,
    className,
  }: CheckboxGroupProps,
  ref,
) {
  const generatedId = useId()
  const groupId = generatedId
  const hintId = `${groupId}-hint`
  const [internalValues, setInternalValues] = useState<string[]>(defaultValue ?? [])
  const values = value ?? internalValues

  const resolvedValidationState: CheckboxValidationState =
    validationState ?? (errorText ? 'error' : successText ? 'success' : 'none')
  const hintText = errorText ?? successText ?? helpText

  function toggleValue(target: string, checked: boolean) {
    const next = checked ? [...values, target] : values.filter((v) => v !== target)
    if (value === undefined) setInternalValues(next)
    onChange?.(next)
  }

  return (
    <fieldset
      ref={ref}
      aria-required={isRequired || undefined}
      className={cn(
        'm-0 flex min-w-0 border-0 p-0 font-[family-name:var(--font-family-primary)]',
        labelPosition === 'left' ? 'flex-row items-baseline gap-[var(--space-12)]' : 'flex-col gap-[var(--space-8)]',
        className,
      )}
    >
      {label && (
        <legend
          id={`${groupId}-label`}
          className="p-0 text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] font-medium text-foreground"
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
        </legend>
      )}

      <div className="flex flex-col gap-[var(--space-4)]">
        <div
          className={cn('flex', orientation === 'horizontal' ? 'flex-row flex-wrap gap-[var(--space-16)]' : 'flex-col gap-[var(--space-12)]')}
        >
          <CheckboxGroupContext.Provider value={{ size, isDisabled, values, toggleValue }}>
            {children}
          </CheckboxGroupContext.Provider>
        </div>

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

      {name && values.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </fieldset>
  )
})
