import type { ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { badgeVariants } from './badgeVariants'

export type BadgeColor = NonNullable<VariantProps<typeof badgeVariants>['color']>
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>

// No `variant`/`emphasis` (subtle vs. bold/solid) prop yet — only one visual treatment (tinted
// background + colored text) is confirmed in Figma today. A future bold/solid emphasis would map
// to a solid `--color-{x}` background + `--color-text-on-primary` text, same pairing Button uses.

export type BadgeProps = {
  children: ReactNode
  /** Defaults to `'neutral'` — the safest, generic status color when nothing more specific
   * applies. */
  color?: BadgeColor
  size?: BadgeSize
  /** Leading icon slot only. Pass a pre-sized icon element, e.g. `<TriangleAlert size={10} />`
   * for `size="sm"`. Renders with `currentColor` so it matches the badge's text color. */
  icon?: ReactNode
  /** Truncates long label text with an ellipsis past this width, exposing the full text via a
   * native `title` attribute on hover. Omit for content-hugging, non-truncating behavior. */
  maxWidth?: number | string
  className?: string
}

export function Badge({ children, color = 'neutral', size = 'sm', icon, maxWidth, className }: BadgeProps) {
  const classes = cn(badgeVariants({ color, size }), className)

  return (
    <span className={classes}>
      {icon && (
        <span className="inline-flex leading-none shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {maxWidth ? (
        // `min-w-0` is required here: flex children default to `min-width: auto`, which silently
        // defeats `truncate` (overflow-hidden + ellipsis) unless overridden.
        <span
          className="truncate min-w-0"
          style={{ maxWidth }}
          title={typeof children === 'string' ? children : undefined}
        >
          {children}
        </span>
      ) : (
        <span>{children}</span>
      )}
    </span>
  )
}
