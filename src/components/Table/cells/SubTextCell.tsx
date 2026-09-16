import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize, CellTone, CellTruncate } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_SECONDARY_TEXT, CELL_TEXT_ALIGN, CELL_TONE_CLASS, isCellValueEmpty } from './cellVariants'

export type SubTextCellProps = {
  children?: ReactNode
  subText?: ReactNode
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  truncate?: CellTruncate
  empty?: ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

export function SubTextCell({ children, subText, align, tone, size, truncate, empty, isDisabled, tooltip, className }: SubTextCellProps) {
  const resolved = useCellProps({ align, tone, size, truncate, empty })
  const isEmpty = isCellValueEmpty(children)
  const clampClass = resolved.truncate ? 'truncate' : 'whitespace-normal break-words'

  return (
    <div
      title={tooltip}
      className={cn(
        'flex w-full min-w-0 flex-col gap-[var(--space-2)]',
        CELL_TEXT_ALIGN[resolved.align],
        isDisabled && CELL_DISABLED_CLASS,
        className,
      )}
    >
      <span className={cn('min-w-0', clampClass, isEmpty ? 'text-muted-foreground' : CELL_TONE_CLASS[resolved.tone])}>
        {isEmpty ? resolved.empty : children}
      </span>
      {!isEmpty && !isCellValueEmpty(subText) && (
        <span className={cn('min-w-0 text-muted-foreground', clampClass, CELL_SECONDARY_TEXT[resolved.size])}>
          {subText}
        </span>
      )}
    </div>
  )
}
