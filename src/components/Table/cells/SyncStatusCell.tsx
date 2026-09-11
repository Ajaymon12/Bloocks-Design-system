// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Cloud, CloudAlert, CloudOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SyncStatus = 'synced' | 'syncing' | 'not-synced' | 'sync-failed'

export type SyncStatusCellProps = {
  status: SyncStatus
  /** Defaults to each status's own label ("Synced", "Syncing…", "Not Synced", "Sync Failed"). */
  label?: string
}

const STATUS_CONFIG: Record<SyncStatus, { icon: typeof Cloud; label: string; className: string; spin?: boolean }> = {
  synced: { icon: Cloud, label: 'Synced', className: 'text-primary' },
  syncing: { icon: RefreshCw, label: 'Syncing…', className: 'text-muted-foreground', spin: true },
  'not-synced': { icon: CloudOff, label: 'Not Synced', className: 'text-muted-foreground' },
  'sync-failed': { icon: CloudAlert, label: 'Sync Failed', className: 'text-destructive' },
}

// Icon + plain text — deliberately not a Badge/pill (see StatusCell), matching the reference
// screenshot where Sync Status reads as plain inline text, unlike the pill-styled Document Status.
export function SyncStatusCell({ status, label }: SyncStatusCellProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div className={cn('inline-flex items-center gap-[var(--space-4)]', config.className)}>
      <Icon size={14} className={config.spin ? 'animate-[spin_0.6s_linear_infinite]' : undefined} />
      <span>{label ?? config.label}</span>
    </div>
  )
}
