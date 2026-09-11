import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonSize, ButtonVariant } from '../Button/Button'
import { ButtonGroupContext } from '../Button/ButtonGroupContext'

export type ButtonGroupProps = {
  /** `Button` elements (or a composed trigger, e.g. a dropdown — see the "With Dropdown" story). */
  children: ReactNode
  /** Shared across every button in the group; an individual Button's own prop still wins. */
  variant?: ButtonVariant
  size?: ButtonSize
  isDisabled?: boolean
  isFullWidth?: boolean
  className?: string
}

const SEGMENTED_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost']

export function ButtonGroup({
  children,
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isFullWidth = false,
  className,
}: ButtonGroupProps) {
  const segmented = SEGMENTED_VARIANTS.includes(variant)

  const classes = cn(
    'inline-flex items-center',
    isFullWidth && 'flex w-full [&>*]:flex-1',
    // Segmented look: square off every button, then round only the outer corners.
    segmented && '[&>*]:rounded-none [&>*:first-child]:rounded-l-[var(--radius-6)] [&>*:last-child]:rounded-r-[var(--radius-6)]',
    // No-border variants need an explicit divider between segments.
    variant === 'primary' && '[&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-r-[rgba(255,255,255,0.24)]',
    (variant === 'secondary' || variant === 'ghost') &&
      '[&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-r-border',
    // Outline already has its own border on every side — overlap adjacent borders into one
    // shared line instead of stacking a divider on top of them.
    variant === 'outline' && '[&>*:not(:first-child)]:-ml-px',
    // Link variants have no box to connect — space them out like regular buttons instead of
    // forcing a segmented look that wouldn't read as anything.
    (variant === 'link' || variant === 'link-secondary') && 'gap-[var(--space-16)] [&>*]:rounded-[var(--radius-6)]',
    className,
  )

  return (
    <ButtonGroupContext.Provider value={{ variant, size, isDisabled, isFullWidth }}>
      <div className={classes} role="group">
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}
