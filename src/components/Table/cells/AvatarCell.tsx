import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize, CellTone } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_JUSTIFY, CELL_SECONDARY_TEXT, CELL_TONE_CLASS, isCellValueEmpty } from './cellVariants'

export type AvatarCellProps = {
  name: string | null | undefined
  /** A second line under the name, e.g. a role or account label — Figma's "With Avatar sub". */
  subText?: ReactNode
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  empty?: ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

const AVATAR_SIZE: Record<CellSize, string> = {
  sm: 'size-5 text-[length:var(--text-caption-2-size)]',
  md: 'size-6 text-[length:var(--text-caption-1-size)]',
}

export function AvatarCell({ name, subText, align, tone, size, empty, isDisabled, tooltip, className }: AvatarCellProps) {
  const resolved = useCellProps({ align, tone, size, empty })
  const isEmpty = isCellValueEmpty(name)

  if (isEmpty) {
    return (
      <div title={tooltip} className={cn('flex w-full items-center', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}>
        <span className="text-muted-foreground">{resolved.empty}</span>
      </div>
    )
  }

  const initial = name!.trim().charAt(0).toUpperCase()

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
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-primary font-medium',
          AVATAR_SIZE[resolved.size],
        )}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('min-w-0 truncate', CELL_TONE_CLASS[resolved.tone])}>{name}</span>
        {!isCellValueEmpty(subText) && (
          <span className={cn('min-w-0 truncate text-muted-foreground', CELL_SECONDARY_TEXT[resolved.size])}>{subText}</span>
        )}
      </span>
    </div>
  )
}
