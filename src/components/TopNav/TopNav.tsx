import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Figma: Top and sidebar → TopBar (node 21706:63943)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21706-63943
// API modelled on Blade's TopNav — TopNav / TopNavBrand / TopNavContent / TopNavActions:
// https://blade.razorpay.com/?path=/docs/components-topnav--docs
//
// The bar stays dark in both themes, as Blade's does. Figma's five TopBar variants are the hover
// and open states of the pieces below (org switcher, text and icon buttons, avatar) rather than
// separate layouts, so they live on those pieces. Menus are composed by the caller with
// ui/dropdown-menu — see TopNav.fixtures.tsx for the org switcher and profile menu.

const labelClasses =
  'font-[family-name:var(--font-family-primary)] text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] font-normal'

export type TopNavProps = {
  /** TopNavBrand, TopNavContent and TopNavActions, in any order. */
  children: ReactNode
  className?: string
}

export function TopNav({ children, className }: TopNavProps) {
  return (
    <header
      className={cn(
        // Each slot pins its own grid column, so leaving TopNavContent out keeps actions on the right.
        'sticky top-0 z-40 grid h-[50px] w-full shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center',
        'bg-[var(--color-topnav-bg)] py-[var(--space-8)] pl-[var(--space-12)] pr-[var(--space-24)] text-[var(--color-topnav-text)]',
        className,
      )}
    >
      {children}
    </header>
  )
}

export type TopNavBrandProps = {
  /** Usually the product logo. */
  children: ReactNode
  /** Makes the brand a link, typically to the home page. */
  href?: string
  /** Name for the link when the logo alone doesn't give one. */
  accessibilityLabel?: string
}

export function TopNavBrand({ children, href, accessibilityLabel }: TopNavBrandProps) {
  const classes = 'col-start-1 flex items-center rounded-[var(--radius-4)] text-inherit no-underline'
  if (href) {
    return (
      <a className={classes} href={href} aria-label={accessibilityLabel}>
        {children}
      </a>
    )
  }
  return <div className={classes}>{children}</div>
}

/** Middle slot, e.g. a search field or tab navigation. */
export function TopNavContent({ children }: { children: ReactNode }) {
  return <div className="col-start-2 flex min-w-0 items-center justify-center">{children}</div>
}

/** Right-hand slot for the org switcher, help buttons and profile avatar. */
export function TopNavActions({ children }: { children: ReactNode }) {
  return <div className="col-start-3 flex items-center gap-[var(--space-12)]">{children}</div>
}

/** The short vertical rule between groups of actions. */
export function TopNavDivider() {
  return <span aria-hidden="true" className="h-[20px] w-px shrink-0 bg-[var(--color-topnav-border)]" />
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export type TopNavButtonProps = NativeButtonProps & {
  /** A 16px lucide icon, e.g. `<Bell />`. */
  icon: ReactNode
  /** Visible label. Omit for an icon-only button, and pass `accessibilityLabel` instead. */
  children?: ReactNode
  accessibilityLabel?: string
}

/** A quiet button on the dark bar, with a text label or icon-only. */
export const TopNavButton = forwardRef<HTMLButtonElement, TopNavButtonProps>(
  ({ icon, children, accessibilityLabel, className, type = 'button', ...rest }, ref) => {
    const iconOnly = children === undefined || children === null
    return (
      <button
        ref={ref}
        type={type}
        aria-label={accessibilityLabel}
        className={cn(
          'inline-flex h-[32px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-[var(--color-topnav-text)]',
          'transition-[background-color] duration-150 ease-in-out [&_svg]:size-[16px] [&_svg]:shrink-0',
          'hover:bg-[var(--color-topnav-surface)] data-[state=open]:bg-[var(--color-topnav-surface)]',
          iconOnly
            ? 'w-[32px] rounded-full'
            : cn('gap-[var(--space-8)] rounded-[var(--radius-8)] px-[var(--space-8)]', labelClasses),
          className,
        )}
        {...rest}
      >
        {icon}
        {children}
      </button>
    )
  },
)

TopNavButton.displayName = 'TopNavButton'

export type TopNavOrgAvatarProps = {
  /** The organization's name. Its first letter is shown. */
  name: string
  /** Background color. Defaults to Figma's teal. */
  color?: string
  className?: string
}

/** The small rounded-square initial used for an organization. */
export function TopNavOrgAvatar({ name, color, className }: TopNavOrgAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4.5px] bg-[var(--color-topnav-org-avatar)]',
        'font-[family-name:var(--font-family-primary)] text-[11px] font-bold leading-none text-[var(--color-text-on-primary)]',
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export type TopNavOrgSwitcherProps = NativeButtonProps & {
  /** The current organization. Long names are truncated. */
  name: string
  /** Background color of the organization's avatar. */
  avatarColor?: string
}

/**
 * The current-organization button. Use it as a `DropdownMenuTrigger asChild`: the chevron flips
 * while the menu is open (Figma's Variant5).
 */
export const TopNavOrgSwitcher = forwardRef<HTMLButtonElement, TopNavOrgSwitcherProps>(
  ({ name, avatarColor, className, type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      title={name}
      className={cn(
        'group inline-flex h-[32px] min-w-0 max-w-[262px] shrink cursor-pointer items-center gap-[6px] rounded-[var(--radius-6)] px-[7px]',
        'border border-solid border-[var(--color-topnav-border)] bg-[var(--color-topnav-surface)] text-[var(--color-topnav-text)]',
        'transition-[border-color] duration-150 ease-in-out hover:border-[var(--color-topnav-text)]',
        labelClasses,
        className,
      )}
      {...rest}
    >
      <TopNavOrgAvatar name={name} color={avatarColor} />
      <span className="min-w-0 truncate">{name}</span>
      <ChevronDown
        size={13}
        className="shrink-0 transition-transform duration-150 ease-in-out group-data-[state=open]:rotate-180"
      />
    </button>
  ),
)

TopNavOrgSwitcher.displayName = 'TopNavOrgSwitcher'

export type TopNavAvatarProps = NativeButtonProps & {
  /** The signed-in user's name. Its first letter is shown. */
  name: string
  /** Defaults to `name`. */
  accessibilityLabel?: string
}

/** The round profile button. Use it as a `DropdownMenuTrigger asChild` for the profile menu. */
export const TopNavAvatar = forwardRef<HTMLButtonElement, TopNavAvatarProps>(
  ({ name, accessibilityLabel, className, type = 'button', ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={accessibilityLabel ?? name}
      className={cn(
        'inline-flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-solid border-transparent',
        'bg-[var(--color-topnav-surface)] text-[var(--color-topnav-avatar-text)] transition-[border-color] duration-150 ease-in-out',
        'hover:border-[var(--color-topnav-border)] data-[state=open]:border-[var(--color-topnav-border)]',
        'font-[family-name:var(--font-family-primary)] text-[length:var(--text-label-1-size)] leading-[var(--text-label-1-line-height)] tracking-[var(--text-label-1-letter-spacing)] font-medium',
        className,
      )}
      {...rest}
    >
      {name.trim().charAt(0).toUpperCase()}
    </button>
  ),
)

TopNavAvatar.displayName = 'TopNavAvatar'
