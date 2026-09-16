import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize, CellTone } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_JUSTIFY, CELL_SECONDARY_TEXT, CELL_TONE_CLASS, isCellValueEmpty } from './cellVariants'

export type NumberCellProps = {
  value: number | null | undefined
  /** Decimal places to show. Defaults to `0` — a plain count. */
  decimals?: number
  /** Appended after the number with a space, e.g. `'%'`, `'kg'`, `'units'`. */
  suffix?: string
  /** Turns off the `en-IN` thousands grouping AmountCell also uses — off by default. */
  disableGrouping?: boolean
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  empty?: React.ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

// A plain numeric cell — right-aligned, tabular figures, but with none of AmountCell's currency
// symbol or Cr/Dr machinery. For quantities, counts and percentages, where a ₹ prefix would be
// wrong. Use AmountCell instead for anything that's actually money.
export function NumberCell({
  value,
  decimals = 0,
  suffix,
  disableGrouping = false,
  align,
  tone,
  size,
  empty,
  isDisabled,
  tooltip,
  className,
}: NumberCellProps) {
  const resolved = useCellProps({ align, tone, size, empty }, { align: 'end' })
  const isEmpty = isCellValueEmpty(value)

  if (isEmpty) {
    return (
      <div title={tooltip} className={cn('flex w-full items-center', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}>
        <span className="text-muted-foreground">{resolved.empty}</span>
      </div>
    )
  }

  const formatted = disableGrouping
    ? value!.toFixed(decimals)
    : new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value!)

  return (
    <div
      title={tooltip}
      className={cn('flex w-full items-center gap-[var(--space-4)]', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}
    >
      <span className={cn('tabular-nums', CELL_TONE_CLASS[resolved.tone])}>{formatted}</span>
      {suffix && <span className={cn('text-muted-foreground', CELL_SECONDARY_TEXT[resolved.size])}>{suffix}</span>}
    </div>
  )
}
