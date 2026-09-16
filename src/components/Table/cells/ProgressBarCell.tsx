import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellSize } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_SECONDARY_TEXT, isCellValueEmpty } from './cellVariants'

export type ProgressBarCellProps = {
  /** Label shown on the left, e.g. a raw count ("10"). */
  label?: ReactNode
  /** 0–100. */
  percent: number | null | undefined
  size?: CellSize
  empty?: ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

export function ProgressBarCell({ label, percent, size, empty, isDisabled, tooltip, className }: ProgressBarCellProps) {
  const resolved = useCellProps({ size, empty })
  const isEmpty = isCellValueEmpty(percent)

  if (isEmpty) {
    return (
      <div title={tooltip} className={cn('flex w-full min-w-[120px] items-center', isDisabled && CELL_DISABLED_CLASS, className)}>
        <span className="text-muted-foreground">{resolved.empty}</span>
      </div>
    )
  }

  const clamped = Math.min(100, Math.max(0, percent!))

  return (
    <div title={tooltip} className={cn('flex flex-col gap-[var(--space-4)] min-w-[120px]', isDisabled && CELL_DISABLED_CLASS, className)}>
      <div className={cn('flex items-center justify-between text-foreground', CELL_SECONDARY_TEXT[resolved.size])}>
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div
        className="h-[var(--space-4)] rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-150 ease-in-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
