import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ProgressBarCellProps = {
  /** Label shown on the left, e.g. a raw count ("10"). */
  label: ReactNode
  /** 0–100. */
  percent: number
  className?: string
}

export function ProgressBarCell({ label, percent, className }: ProgressBarCellProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className={cn('flex flex-col gap-[var(--space-4)] min-w-[120px]', className)}>
      <div className="flex items-center justify-between text-[length:var(--text-body-4-size)] text-foreground">
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
