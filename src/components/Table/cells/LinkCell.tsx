import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign } from './cellVariants'
import { CELL_TEXT_ALIGN, isCellValueEmpty } from './cellVariants'

export type LinkCellProps = {
  children?: ReactNode
  href?: string
  onClick?: () => void
  align?: CellAlign
  empty?: ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

const linkClasses =
  'text-primary no-underline hover:underline truncate text-left bg-transparent border-0 p-0 cursor-pointer'

// Disabled mirrors Button.tsx's own treatment for a link-as-button: `href` is dropped (so it's
// out of tab order and can't be middle-clicked/opened in a new tab) rather than just dimmed, and
// a real `<button>` gets the native `disabled` attribute.
export function LinkCell({ children, href, onClick, align, empty, isDisabled, tooltip, className }: LinkCellProps) {
  const resolved = useCellProps({ align, empty })

  if (isCellValueEmpty(children)) {
    return (
      <span title={tooltip} className={cn('block text-muted-foreground', CELL_TEXT_ALIGN[resolved.align], className)}>
        {resolved.empty}
      </span>
    )
  }

  const classes = cn(linkClasses, CELL_TEXT_ALIGN[resolved.align], isDisabled && 'opacity-50 cursor-not-allowed', className)

  if (href) {
    return (
      <a
        className={classes}
        href={isDisabled ? undefined : href}
        title={tooltip}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={isDisabled ? (event) => event.preventDefault() : undefined}
      >
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} title={tooltip} disabled={isDisabled} onClick={onClick}>
      {children}
    </button>
  )
}
