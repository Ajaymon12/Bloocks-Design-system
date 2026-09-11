import { forwardRef, useContext } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from './buttonVariants'
import { ButtonGroupContext } from './ButtonGroupContext'

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

const ICON_ONLY_SPINNER_SIZE: Record<ButtonSize, number> = {
  xss: 12,
  xs: 14,
  sm: 16,
  md: 18,
}

export type ButtonProps = {
  /** Omit for icon-only usage (requires `accessibilityLabel`). */
  children?: ReactNode
  variant?: ButtonVariant
  /** `xss`/`xs` are only meaningful for icon-only buttons. */
  size?: ButtonSize
  /** Swaps the brand color for the danger color throughout. */
  isDestructive?: boolean
  isDisabled?: boolean
  /** Shows a spinner in place of the leading icon and blocks interaction. */
  isLoading?: boolean
  isFullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /** Renders an `<a>` instead of a `<button>`. */
  href?: string
  target?: string
  rel?: string
  /** Merges props onto the single child instead of rendering a `<button>`/`<a>` — for composing
   * with e.g. a router `Link`. Takes priority over `href`. */
  asChild?: boolean
  /** Required (by convention) when the button is icon-only. */
  accessibilityLabel?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  className?: string
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      children,
      variant,
      size,
      isDestructive = false,
      isDisabled,
      isLoading = false,
      isFullWidth,
      leadingIcon,
      trailingIcon,
      href,
      target,
      rel,
      asChild = false,
      accessibilityLabel,
      type = 'button',
      onClick,
      className,
    },
    ref,
  ) => {
    // Inside a <ButtonGroup>, variant/size/isDisabled/isFullWidth come from its shared context —
    // an explicit prop on this specific Button still wins over the group's value. `isLoading`
    // is deliberately not part of the shared context: it always stays per-button.
    const group = useContext(ButtonGroupContext)
    const resolvedVariant = variant ?? group?.variant ?? 'primary'
    const resolvedSize = size ?? group?.size ?? 'md'
    const resolvedIsDisabled = isDisabled ?? group?.isDisabled ?? false
    const resolvedIsFullWidth = isFullWidth ?? group?.isFullWidth ?? false

    const iconOnly = !children
    const disabled = resolvedIsDisabled || isLoading

    const classes = cn(
      buttonVariants({
        variant: resolvedVariant,
        size: resolvedSize,
        isDestructive,
        isFullWidth: resolvedIsFullWidth,
        iconOnly,
      }),
      className,
    )

    const spinner = (
      <span className="inline-flex leading-none" aria-hidden="true">
        <Loader2 size={iconOnly ? ICON_ONLY_SPINNER_SIZE[resolvedSize] : 16} className="animate-[spin_0.6s_linear_infinite]" />
      </span>
    )

    const content = (
      <>
        {isLoading ? spinner : leadingIcon && (
          <span className="inline-flex leading-none" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        {children && <span className="inline-flex">{children}</span>}
        {!isLoading && trailingIcon && (
          <span className="inline-flex leading-none" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </>
    )

    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={classes}
          aria-label={accessibilityLabel}
          aria-disabled={disabled || undefined}
          aria-busy={isLoading || undefined}
        >
          {children}
        </Slot>
      )
    }

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          href={disabled ? undefined : href}
          target={target}
          rel={rel}
          aria-label={accessibilityLabel}
          aria-disabled={disabled || undefined}
          aria-busy={isLoading || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={disabled ? (event) => event.preventDefault() : onClick}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        disabled={disabled}
        aria-label={accessibilityLabel}
        aria-busy={isLoading || undefined}
        onClick={onClick}
      >
        {content}
      </button>
    )
  },
)

Button.displayName = 'Button'
