import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/Badge'

// Modelled on Blade's BaseFilterChip:
// https://blade.razorpay.com/?path=/docs/components-basefilterchip--docs
// Deliberate departure: Blade signals "nothing selected" with a dashed border. We keep a solid
// border in both states and carry selection with the tint, matching the rest of this system.

export type FilterChipProps = {
  /** Chip title, e.g. "Department". Shown alone until something is selected. */
  label: string
  /** Selected value(s). A chip is "selected" when this is non-empty — it's always controlled,
   * because the selection lives in whatever the chip triggers (a panel, menu or date picker). */
  value?: string | string[]
  /** `'multiple'` collapses more than one selection into a count badge. */
  selectionType?: 'single' | 'multiple'
  /** Renders the trailing clear (×) once something is selected. Set `false` for filters that must
   * always hold a value, e.g. a date range with a mandatory default. */
  showClearButton?: boolean
  onClearButtonClick?: (args: { value: string | string[] }) => void
  isDisabled?: boolean
  className?: string
} & Omit<ComponentProps<'button'>, 'value' | 'onClick' | 'className'> &
  Pick<ComponentProps<'button'>, 'onClick'>

function toArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value
  return value == null || value === '' ? [] : [value]
}

/** The chip is a container holding two sibling buttons — a trigger and a clear — because a
 * <button> can't legally nest another. Ref goes on the container so a floating panel anchors to
 * the whole chip, while `...rest` (Radix's onClick / aria-expanded / data-state when used with
 * `asChild`) lands on the trigger, where the semantics belong. */
export const FilterChip = forwardRef<HTMLDivElement, FilterChipProps>(function FilterChip(
  {
    label,
    value,
    selectionType = 'single',
    showClearButton = true,
    onClearButtonClick,
    isDisabled = false,
    className,
    ...rest
  },
  ref,
) {
  const values = toArray(value)
  const isSelected = values.length > 0
  const hasClear = isSelected && showClearButton && !isDisabled

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-[var(--space-28)] w-fit items-center overflow-hidden rounded-[var(--radius-8)] border',
        'font-[family-name:var(--font-family-primary)]',
        'transition-[border-color,background-color] duration-150 ease-in-out',
        isSelected
          ? 'border-[var(--color-popover-border)] bg-[var(--color-primary-subtle)]'
          : 'border-border bg-card',
        isDisabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        disabled={isDisabled}
        className={cn(
          'flex h-full max-w-[220px] items-center gap-[var(--space-4)] border-0 bg-transparent',
          'pl-[var(--space-12)]',
          hasClear ? 'pr-[var(--space-8)]' : 'pr-[var(--space-12)]',
          'text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium',
          isSelected ? 'text-primary' : 'text-foreground',
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--color-bg-subtle)]',
        )}
        {...rest}
      >
        {/* The ": " is part of this text run, not markup between spans: the flex gap supplies the
            visual spacing, but without a real space character the accessible name and textContent
            would read "Department:Sales". The trailing space collapses when rendered, so it costs
            nothing visually. */}
        <span className="truncate">
          {label}
          {isSelected && values.length === 1 ? ': ' : ''}
        </span>

        {/* One selection reads better spelled out than as a bare "1"; beyond that a count is
            more compact than a list of names. */}
        {isSelected && values.length === 1 && <span className="truncate font-semibold">{values[0]}</span>}
        {isSelected && values.length > 1 && (
          <Badge size="sm" color="primary">
            {values.length}
          </Badge>
        )}

        {/* Rotated from any ancestor carrying data-state="open" — Radix sets that on the trigger
            when the chip is used as a Popover/Menu trigger, and the chip needs no `open` prop as a
            result. Note Tailwind v4's rotate-* sets the standalone `rotate` property, not
            `transform`, so assert on `rotate` when testing this. */}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="shrink-0 transition-transform duration-150 [[data-state=open]_&]:rotate-180"
        />
      </button>

      {hasClear && (
        <>
          <span aria-hidden="true" className="h-full w-px shrink-0 bg-[var(--color-popover-border)]" />
          <button
            type="button"
            aria-label={`Clear ${label} value`}
            onClick={() => onClearButtonClick?.({ value: value ?? '' })}
            className={cn(
              'flex h-full shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent',
              'px-[var(--space-8)] text-primary hover:bg-[var(--color-bg-subtle)]',
            )}
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  )
})
