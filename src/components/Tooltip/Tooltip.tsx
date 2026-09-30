import type { ComponentProps, ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// Figma: OpenSource shadcn/ui kit, Tooltip
// https://www.figma.com/design/SOI5iogKWwEDwx12jqGeWF/OpenSource-shadcn-ui---kit-for-Figma--Community-?node-id=13-896
// Its two usage frames — over a Button (node 2819:31796) and beside a collapsed navigation rail
// (node 2819:31800) — are the `Default` and `BesideNavigation` stories.
//
// Built on Radix Tooltip, so it opens on hover and on keyboard focus, closes on Escape, stays open
// while the pointer moves onto it, and wires `aria-describedby` to the trigger. It is for a short
// text hint; anything interactive belongs in a Popover.

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'

export type TooltipProps = {
  /** The hint. Kept short, one line. */
  label: ReactNode
  /** The element that shows the hint. Must accept a ref and hover/focus handlers — a Button or a
   * native element. It is used as-is, not wrapped in an extra element. */
  children: ReactNode
  /** Preferred side; flips to the opposite side when there isn't room. Above the trigger by default,
   * as in Figma. */
  side?: TooltipSide
  align?: 'start' | 'center' | 'end'
  /** Gap between the trigger and the tooltip. */
  sideOffset?: number
  /** Milliseconds of hover before it opens. Default 200. */
  delayDuration?: number
  /** Turns the hint off without unwrapping the trigger, e.g. for an expanded nav item whose label is
   * already visible. */
  isDisabled?: boolean
  /** Controlled open state, for tests and stories. */
  isOpen?: boolean
  className?: string
}

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  delayDuration = 200,
  isDisabled = false,
  isOpen,
  className,
}: TooltipProps) {
  if (isDisabled) return <>{children}</>

  return (
    // Its own Provider so a lone Tooltip works with no setup; wrap several in `TooltipProvider` to
    // share the "skip the delay once one is open" behaviour.
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={isOpen}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align} sideOffset={sideOffset} className={className}>
          {label}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

function TooltipContent({ className, children, ...props }: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'z-[70] w-fit max-w-[320px] rounded-[var(--radius-6)] border border-[var(--color-popover-border)] bg-card px-[var(--space-12)] py-[6px]',
          'font-[family-name:var(--font-family-primary)] text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-normal tracking-[var(--text-body-3-letter-spacing)] text-primary shadow-[var(--shadow-tooltip)]',
          'data-[state=delayed-open]:animate-[tooltip-in_120ms_ease-out] data-[state=instant-open]:animate-[tooltip-in_120ms_ease-out]',
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
