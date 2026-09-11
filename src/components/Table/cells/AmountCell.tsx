import { cn } from '@/lib/utils'

export type AmountCellVariant = 'plain' | 'credit' | 'debit'

export type AmountCellProps = {
  /** Amount in rupees (e.g. `19000` renders as "₹19,000.00"). */
  amount: number
  /** Adds a trailing "Cr"/"Dr" suffix for ledger use cases. `'plain'` (default) shows none. */
  variant?: AmountCellVariant
  className?: string
}

const SUFFIX: Record<AmountCellVariant, string | null> = {
  plain: null,
  credit: 'Cr',
  debit: 'Dr',
}

export function AmountCell({ amount, variant = 'plain', className }: AmountCellProps) {
  const [whole, fraction = '00'] = amount.toFixed(2).split('.')
  const formattedWhole = new Intl.NumberFormat('en-IN').format(Number(whole))
  const suffix = SUFFIX[variant]

  return (
    <div className={cn('flex items-center justify-between gap-[var(--space-8)]', className)}>
      <span className="text-foreground tabular-nums">
        ₹{formattedWhole}
        <span className="text-muted-foreground">.{fraction}</span>
      </span>
      {suffix && <span className="text-[length:var(--text-body-4-size)] text-muted-foreground">{suffix}</span>}
    </div>
  )
}
