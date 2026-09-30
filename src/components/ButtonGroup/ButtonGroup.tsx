import { Children, isValidElement, useContext } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonSize, ButtonVariant } from '../Button/Button'
import { ButtonGroupContext } from '../Button/ButtonGroupContext'

// Modelled on shadcn/ui's Button Group: a `group` that joins related controls into one segmented
// unit, horizontally or vertically, with a separator, a text segment, nesting, and inputs / selects
// / menu and popover triggers as members. Tab moves between the members like any other controls.

export type ButtonGroupOrientation = 'horizontal' | 'vertical'

export type ButtonGroupProps = {
  /** `Button` elements — or a composed trigger (dropdown, popover), a `TextInput` / `Select`, a
   * `ButtonGroupText` or `ButtonGroupSeparator`, or other `ButtonGroup`s (see nesting below). */
  children: ReactNode
  /** Shared across every button in the group; an individual Button's own prop still wins. A nested
   * group inherits it from its parent unless it sets its own. */
  variant?: ButtonVariant
  size?: ButtonSize
  isDisabled?: boolean
  isFullWidth?: boolean
  /** `'vertical'` stacks the members and rounds the top and bottom instead of the left and right. */
  orientation?: ButtonGroupOrientation
  /** Names the group for screen readers (`aria-label`), e.g. "Text formatting". */
  accessibilityLabel?: string
  'aria-labelledby'?: string
  className?: string
}

const SEGMENTED_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost']
// Every rule below targets `[&>*]` — the group's direct children — so a member only has to be a
// single element (a Button, or a wrapper like a TextInput's root). Fields (`data-slot="field"`) sit
// one level down inside their own root, so they get the same treatment through `_[data-slot=field]`.
// Class names are written out in full (never interpolated): Tailwind only generates CSS for class
// strings it can find verbatim in the source.
function segmentClasses(variant: ButtonVariant, orientation: ButtonGroupOrientation) {
  const horizontal = orientation === 'horizontal'
  return cn(
    // Square every member, then round only the outer corners of the whole unit.
    '[&>*]:rounded-none [&_[data-slot=field]]:rounded-none',
    horizontal
      ? '[&>*:first-child]:rounded-l-[var(--radius-6)] [&>*:last-child]:rounded-r-[var(--radius-6)] [&>*:first-child_[data-slot=field]]:rounded-l-[var(--radius-6)] [&>*:last-child_[data-slot=field]]:rounded-r-[var(--radius-6)]'
      : '[&>*:first-child]:rounded-t-[var(--radius-6)] [&>*:last-child]:rounded-b-[var(--radius-6)] [&>*:first-child_[data-slot=field]]:rounded-t-[var(--radius-6)] [&>*:last-child_[data-slot=field]]:rounded-b-[var(--radius-6)]',
    // A field member takes the space the buttons leave.
    // …and matches their height (a field is a little shorter than a button by default).
    '[&>*:has([data-slot=field])]:min-w-0 [&>*:has([data-slot=field])]:flex-1 [&>*:has([data-slot=field])]:self-stretch [&>*:has([data-slot=field])>[data-slot=field]]:flex-1',
    // Stack order: whatever holds focus is drawn above its neighbours so its ring isn't overlapped.
    '[&>*]:relative [&>*:focus-visible]:z-10 [&_[data-slot=field]]:relative [&_[data-slot=field]:focus-within]:z-10',
    // No-border variants need an explicit divider between members — unless the next sibling is an
    // explicit separator, which is the divider itself…
    variant === 'primary' &&
      (horizontal
        ? '[&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-r [&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-r-[rgba(255,255,255,0.24)]'
        : '[&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-b [&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-b-[rgba(255,255,255,0.24)]'),
    (variant === 'secondary' || variant === 'ghost') &&
      (horizontal
        ? '[&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-r [&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-r-border'
        : '[&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-b [&>*:not(:last-child):not(:has(+[data-slot=button-group-separator]))]:border-b-border'),
    // …while outline members already have a border on every side: overlap neighbours into one
    // shared line instead of stacking a divider on top.
    variant === 'outline' && (horizontal ? '[&>*:not(:first-child)]:-ml-px' : '[&>*:not(:first-child)]:-mt-px'),
  )
}

export function ButtonGroup({
  children,
  variant,
  size,
  isDisabled,
  isFullWidth = false,
  orientation = 'horizontal',
  accessibilityLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: ButtonGroupProps) {
  const parent = useContext(ButtonGroupContext)
  const resolvedVariant = variant ?? parent?.variant ?? 'primary'
  const resolvedSize = size ?? parent?.size ?? 'md'
  const resolvedDisabled = isDisabled ?? parent?.isDisabled ?? false

  // A group whose members are themselves groups is just a spaced row/column of units — each inner
  // group does its own joining, so the outer one must not square them off a second time.
  const isNesting = Children.toArray(children).some((child) => isValidElement(child) && child.type === ButtonGroup)
  const horizontal = orientation === 'horizontal'
  const segmented = !isNesting && SEGMENTED_VARIANTS.includes(resolvedVariant)

  const classes = cn(
    'inline-flex',
    horizontal ? 'items-center' : 'flex-col items-stretch',
    isNesting && 'gap-[var(--space-8)]',
    // Full width splits the space equally between buttons; when there's a field, the field takes it
    // instead (segmentClasses) and the buttons keep their natural size.
    isFullWidth &&
      (horizontal ? 'flex w-full [&:not(:has([data-slot=field]))>*]:flex-1' : 'flex w-full'),
    segmented && segmentClasses(resolvedVariant, orientation),
    // Link variants have no box to connect — space them out like regular buttons instead of
    // forcing a segmented look that wouldn't read as anything.
    !isNesting &&
      (resolvedVariant === 'link' || resolvedVariant === 'link-secondary') &&
      'gap-[var(--space-16)] [&>*]:rounded-[var(--radius-6)]',
    className,
  )

  return (
    <ButtonGroupContext.Provider
      // isFullWidth isn't shared with the buttons: the group itself spreads the width (equal shares, or
      // to a field member), and a `w-full` on each button would fight that.
      value={{ variant: resolvedVariant, size: resolvedSize, isDisabled: resolvedDisabled, isFullWidth: false, orientation }}
    >
      <div
        className={classes}
        role="group"
        data-slot="button-group"
        aria-label={accessibilityLabel}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}

export type ButtonGroupSeparatorProps = {
  /** Which way the line runs. Defaults to the one that divides members: vertical in a horizontal
   * group, horizontal in a vertical one. */
  orientation?: ButtonGroupOrientation
  className?: string
}

/** A visible divider between members. Outline members don't need one — they have borders — but
 * solid and tinted variants read better with it. */
export function ButtonGroupSeparator({ orientation, className }: ButtonGroupSeparatorProps) {
  const group = useContext(ButtonGroupContext)
  const resolved = orientation ?? (group?.orientation === 'vertical' ? 'horizontal' : 'vertical')
  return (
    <div
      role="separator"
      aria-orientation={resolved}
      data-slot="button-group-separator"
      className={cn(
        'shrink-0 self-stretch',
        resolved === 'vertical' ? 'w-px' : 'h-px',
        group?.variant === 'primary' ? 'bg-[rgba(255,255,255,0.24)]' : 'bg-border',
        className,
      )}
    />
  )
}

export type ButtonGroupTextProps = {
  children: ReactNode
  /** Renders a `<label>` for this control id — use it to caption an adjacent input. */
  htmlFor?: string
  className?: string
}

const TEXT_SIZE: Record<'sm' | 'md', string> = {
  sm: 'text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)]',
  md: 'text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)]',
}

/** Plain, non-interactive text sitting in the group, e.g. a "https://" prefix or a count. */
export function ButtonGroupText({ children, htmlFor, className }: ButtonGroupTextProps) {
  const group = useContext(ButtonGroupContext)
  const Tag = htmlFor ? 'label' : 'div'
  const size = group?.size === 'sm' ? 'sm' : 'md'
  return (
    <Tag
      htmlFor={htmlFor}
      className={cn(
        'inline-flex items-center box-border border border-border bg-[var(--color-bg-subtle)] text-foreground',
        'rounded-[var(--radius-6)] px-[var(--space-12)] py-[var(--space-8)] whitespace-nowrap',
        'font-[family-name:var(--font-family-primary)] font-medium',
        TEXT_SIZE[size],
        className,
      )}
    >
      {children}
    </Tag>
  )
}
