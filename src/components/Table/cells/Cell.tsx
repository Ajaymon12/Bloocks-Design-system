import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellBaseProps } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_ICON_SLOT, CELL_JUSTIFY, CELL_TONE_CLASS, isCellValueEmpty } from './cellVariants'

export type CellProps = CellBaseProps & {
  children?: ReactNode
}

/**
 * The plain cell every other cell (PlainTextCell, AmountCell, StatusCell, …) is built from the
 * same vocabulary as, and the direct escape hatch for content none of them cover — a one-off
 * tone on otherwise plain text: `<Cell tone="negative">3 Transactions</Cell>`, or a column-wide
 * empty-value placeholder with nothing else to say: `<Cell empty="Not Mapped">{value}</Cell>`.
 *
 * Resolves align/tone/size/truncate/empty as own prop > column `meta` > default — see
 * `useCellProps` in `cellContext.ts`.
 */
export function Cell({
  children,
  align,
  tone,
  size,
  truncate,
  empty,
  leadingIcon,
  trailingIcon,
  isDisabled,
  tooltip,
  className,
}: CellProps) {
  const resolved = useCellProps({ align, tone, size, truncate, empty })
  const isEmpty = isCellValueEmpty(children)

  return (
    <div
      title={tooltip}
      className={cn(
        'flex w-full min-w-0 items-center gap-[var(--space-8)]',
        CELL_JUSTIFY[resolved.align],
        isDisabled && CELL_DISABLED_CLASS,
        className,
      )}
    >
      {leadingIcon && !isEmpty && (
        <span className={cn(CELL_ICON_SLOT[resolved.size], 'text-muted-foreground')} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span
        className={cn(
          'min-w-0',
          resolved.truncate ? 'truncate' : 'whitespace-normal break-words',
          isEmpty ? 'text-muted-foreground' : CELL_TONE_CLASS[resolved.tone],
        )}
      >
        {isEmpty ? resolved.empty : children}
      </span>
      {trailingIcon && !isEmpty && (
        <span className={cn(CELL_ICON_SLOT[resolved.size], 'text-muted-foreground')} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </div>
  )
}
