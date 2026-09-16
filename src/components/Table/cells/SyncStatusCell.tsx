// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Cloud, CloudAlert, CloudOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_ICON_SLOT, CELL_JUSTIFY, isCellValueEmpty } from './cellVariants'

export type SyncStatus = 'synced' | 'syncing' | 'not-synced' | 'sync-failed'

export type SyncStatusCellProps = {
  status: SyncStatus | null | undefined
  /** Defaults to each status's own label ("Synced", "Syncing…", "Not Synced", "Sync Failed"). */
  label?: string
  align?: CellAlign
  size?: CellSize
  empty?: React.ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

const STATUS_CONFIG: Record<SyncStatus, { icon: typeof Cloud; label: string; className: string; spin?: boolean }> = {
  synced: { icon: Cloud, label: 'Synced', className: 'text-primary' },
  syncing: { icon: RefreshCw, label: 'Syncing…', className: 'text-muted-foreground', spin: true },
  'not-synced': { icon: CloudOff, label: 'Not Synced', className: 'text-muted-foreground' },
  'sync-failed': { icon: CloudAlert, label: 'Sync Failed', className: 'text-destructive' },
}

// Icon + plain text — deliberately not a Badge/pill (see StatusCell), matching the reference
// screenshot where Sync Status reads as plain inline text, unlike the pill-styled Document Status.
// Icon and color are locked to `status` on purpose (unlike PlainTextCell's free `tone`) — a "Sync
// Failed" row reading anything but the danger color would be misleading.
export function SyncStatusCell({ status, label, align, size, empty, isDisabled, tooltip, className }: SyncStatusCellProps) {
  const resolved = useCellProps({ align, size, empty })
  const isEmpty = isCellValueEmpty(status)

  if (isEmpty) {
    return (
      <div title={tooltip} className={cn('flex w-full items-center', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}>
        <span className="text-muted-foreground">{resolved.empty}</span>
      </div>
    )
  }

  const config = STATUS_CONFIG[status!]
  const Icon = config.icon

  return (
    <div
      title={tooltip}
      className={cn(
        'flex w-full items-center gap-[var(--space-4)]',
        CELL_JUSTIFY[resolved.align],
        config.className,
        isDisabled && CELL_DISABLED_CLASS,
        className,
      )}
    >
      <span className={CELL_ICON_SLOT[resolved.size]}>
        <Icon className={config.spin ? 'animate-[spin_0.6s_linear_infinite]' : undefined} />
      </span>
      <span>{label ?? config.label}</span>
    </div>
  )
}
