import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize, CellTone } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_JUSTIFY, CELL_SECONDARY_TEXT, CELL_TONE_CLASS, isCellValueEmpty } from './cellVariants'

export type AmountCellVariant = 'plain' | 'credit' | 'debit'

export type AmountCellProps = {
  /** Amount in rupees (e.g. `19000` renders as "₹19,000.00"). */
  amount: number | null | undefined
  /** Adds a trailing "Cr"/"Dr" suffix for ledger use cases. `'plain'` (default) shows none. */
  variant?: AmountCellVariant
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  empty?: React.ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

const SUFFIX: Record<AmountCellVariant, string | null> = {
  plain: null,
  credit: 'Cr',
  debit: 'Dr',
}

// Right-aligned by default — Figma: Karbon - AI Accountant, Table (Amount/Credit/Debit cells,
// node 24028:1090). A column using AmountCell should still declare `meta: { align: 'end' }` so
// its header agrees; see columnHeader.tsx / Table.tsx's <th> composition.
export function AmountCell({ amount, variant = 'plain', align, tone, size, empty, isDisabled, tooltip, className }: AmountCellProps) {
  const resolved = useCellProps({ align, tone, size, empty }, { align: 'end' })
  const isEmpty = isCellValueEmpty(amount)

  if (isEmpty) {
    return (
      <div title={tooltip} className={cn('flex w-full items-center', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}>
        <span className="text-muted-foreground">{resolved.empty}</span>
      </div>
    )
  }

  const [whole, fraction = '00'] = amount!.toFixed(2).split('.')
  const formattedWhole = new Intl.NumberFormat('en-IN').format(Number(whole))
  const suffix = SUFFIX[variant]

  return (
    <div
      title={tooltip}
      className={cn('flex w-full items-center gap-[var(--space-8)]', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}
    >
      <span className={cn('tabular-nums', CELL_TONE_CLASS[resolved.tone])}>
        ₹{formattedWhole}
        <span className={cn('text-muted-foreground', CELL_SECONDARY_TEXT[resolved.size])}>.{fraction}</span>
      </span>
      {suffix && <span className={cn('text-muted-foreground', CELL_SECONDARY_TEXT[resolved.size])}>{suffix}</span>}
    </div>
  )
}
