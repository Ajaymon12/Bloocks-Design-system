import { createContext, useContext, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Figma: slide-over panels — the narrow help panel (node 21746:48989) and the wide detail
// panels (node 10672:53263)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21746-48989
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=10672-53263
// API modelled on Blade's Drawer — Drawer / DrawerHeader / DrawerBody / DrawerFooter:
// https://blade.razorpay.com/?path=/docs/components-drawer--docs
//
// Additions over Blade, from Figma: two widths (medium 445px, large 928px), a `topOffset` so the
// panel can open below the TopNav, and DrawerSection for the bordered cards the wide panels use.
// Built on Radix Dialog, so focus is trapped inside, Escape and an outside click dismiss, and
// focus returns to the trigger on close.

export type DrawerSize = 'medium' | 'large'

const WIDTH: Record<DrawerSize, string> = {
  medium: 'w-[445px]',
  large: 'w-[928px]',
}

const DrawerContext = createContext<{ size: DrawerSize }>({ size: 'medium' })

const labelTwoClasses =
  'text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)]'

export type DrawerProps = {
  isOpen: boolean
  /** Called on Escape, an outside click, or the close button. Set `isOpen` to false here. */
  onDismiss: () => void
  /** DrawerHeader, DrawerBody and DrawerFooter. */
  children: ReactNode
  /** `medium` (445px) for help and quick panels, `large` (928px) for detail and edit forms. */
  size?: DrawerSize
  /** Pixels from the top of the viewport, e.g. `50` to open below the TopNav and keep it visible. */
  topOffset?: number
  /** Dims the page behind the drawer. Defaults to true. */
  showOverlay?: boolean
  /** Names the drawer when it has no DrawerHeader. */
  accessibilityLabel?: string
  className?: string
}

export function Drawer({
  isOpen,
  onDismiss,
  children,
  size = 'medium',
  topOffset = 0,
  showOverlay = true,
  accessibilityLabel,
  className,
}: DrawerProps) {
  // Radix returns focus to a Dialog.Trigger on close, but a controlled drawer has none, so focus
  // would fall to <body>. Remember what was focused when the drawer opened and restore it instead.
  const returnFocusRef = useRef<HTMLElement | null>(null)

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
      <DialogPrimitive.Portal>
        {showOverlay && (
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 bg-[var(--color-overlay)]',
              'data-[state=open]:animate-[overlay-in_200ms_ease-out] data-[state=closed]:animate-[overlay-out_160ms_ease-in]',
            )}
            style={{ top: topOffset }}
          />
        )}
        <DialogPrimitive.Content
          // Subtitles are visible text, not a formal description; opt out of Radix's warning.
          aria-describedby={undefined}
          // Fires before focus moves into the drawer, so activeElement is still the opener.
          onOpenAutoFocus={(event) => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
            // Focus the panel itself rather than its first control: screen readers still announce
            // the dialog, keyboard users Tab to the first control, and a mouse open doesn't light
            // up a focus ring on whatever button happens to come first.
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef.current?.focus()
          }}
          className={cn(
            'fixed bottom-0 right-0 z-50 flex max-w-full flex-col overflow-hidden outline-none',
            'bg-[var(--color-drawer-bg)] shadow-[var(--shadow-drawer)] font-[family-name:var(--font-family-primary)] text-foreground',
            'data-[state=open]:animate-[drawer-in_260ms_cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:animate-[drawer-out_180ms_ease-in]',
            WIDTH[size],
            className,
          )}
          style={{ top: topOffset }}
        >
          {accessibilityLabel && <DialogPrimitive.Title className="sr-only">{accessibilityLabel}</DialogPrimitive.Title>}
          <DrawerContext.Provider value={{ size }}>{children}</DrawerContext.Provider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const TITLE_CLASSES: Record<DrawerSize, string> = {
  medium:
    'text-[length:var(--text-label-1-size)] leading-[var(--text-label-1-line-height)] tracking-[var(--text-label-1-letter-spacing)] font-semibold',
  large:
    'text-[length:var(--text-h6-size)] leading-[var(--text-h6-line-height)] tracking-[var(--text-h6-letter-spacing)] font-medium',
}

export type DrawerHeaderProps = {
  /** Also the drawer's accessible name. */
  title: string
  subtitle?: string
  /** Rendered after the title, e.g. a Badge. */
  titleSuffix?: ReactNode
  /** Actions before the close button, e.g. a menu of options. */
  trailing?: ReactNode
  /** Shows a back button before the title, for drawers with more than one view. */
  showBackButton?: boolean
  onBackButtonClick?: () => void
  /** Defaults to true. Escape and an outside click still dismiss when it's hidden. */
  showCloseButton?: boolean
  /** Content under the title row, e.g. a summary of the record. */
  children?: ReactNode
}

export function DrawerHeader({
  title,
  subtitle,
  titleSuffix,
  trailing,
  showBackButton = false,
  onBackButtonClick,
  showCloseButton = true,
  children,
}: DrawerHeaderProps) {
  const { size } = useContext(DrawerContext)
  const isLarge = size === 'large'

  return (
    <header
      className={cn(
        'flex shrink-0 flex-col gap-[var(--space-16)]',
        isLarge
          ? 'border-b border-solid border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-[var(--space-24)] py-[var(--space-16)]'
          : 'px-[var(--space-16)] pt-[var(--space-16)]',
      )}
    >
      <div className={cn('flex gap-[var(--space-16)]', subtitle ? 'items-start' : 'items-center')}>
        {showBackButton && (
          <button
            type="button"
            aria-label="Back"
            onClick={onBackButtonClick}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-8)] border-0 p-[var(--space-8)]',
              'bg-[var(--color-primary-subtle)] text-primary transition-colors duration-150',
              'hover:bg-[color-mix(in_srgb,var(--color-primary-subtle),var(--color-primary)_12%)]',
            )}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <div className="flex min-w-0 items-center gap-[var(--space-8)]">
            <DialogPrimitive.Title className={cn('m-0 truncate text-[var(--color-text-secondary)]', TITLE_CLASSES[size])}>
              {title}
            </DialogPrimitive.Title>
            {titleSuffix}
          </div>
          {subtitle && (
            <p className={cn('m-0 text-[var(--color-text-secondary)] opacity-75', labelTwoClasses)}>{subtitle}</p>
          )}
        </div>
        {(trailing || showCloseButton) && (
          <div className="flex shrink-0 items-center gap-[var(--space-24)]">
            {trailing}
            {showCloseButton && (
              <DialogPrimitive.Close
                aria-label="Close"
                className="inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-4)] border-0 bg-transparent p-0 text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-foreground"
              >
                <X size={isLarge ? 24 : 20} />
              </DialogPrimitive.Close>
            )}
          </div>
        )}
      </div>
      {children}
    </header>
  )
}

/** The scrolling middle of the drawer. */
export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  const { size } = useContext(DrawerContext)
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-y-auto',
        size === 'large'
          ? 'gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-12)]'
          : 'gap-[var(--space-24)] p-[var(--space-16)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Actions pinned to the bottom, right-aligned. Put the primary action last. */
export function DrawerFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-end gap-[var(--space-12)] border-t border-solid border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-[var(--space-24)] py-[var(--space-12)]">
      {children}
    </footer>
  )
}

export type DrawerSectionProps = {
  title?: string
  /** Actions on the right of the section's title bar. */
  trailing?: ReactNode
  children: ReactNode
  className?: string
}

/** A bordered card inside DrawerBody that groups related fields under a title bar. */
export function DrawerSection({ title, trailing, children, className }: DrawerSectionProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'shrink-0 rounded-[var(--radius-6)] border border-solid border-[var(--color-border-subtle)] bg-[var(--color-surface)]',
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-[var(--space-8)] border-b border-solid border-[var(--color-border-subtle)] px-[var(--space-16)] py-[var(--space-12)]">
          <h3
            id={titleId}
            className="m-0 truncate text-[length:var(--text-label-1-size)] leading-[var(--text-label-1-line-height)] tracking-[var(--text-label-1-letter-spacing)] font-medium text-[var(--color-text-secondary)]"
          >
            {title}
          </h3>
          {trailing}
        </div>
      )}
      <div className="flex flex-col gap-[var(--space-16)] p-[var(--space-16)]">{children}</div>
    </section>
  )
}
