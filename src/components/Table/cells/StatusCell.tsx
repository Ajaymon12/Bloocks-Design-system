import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Info } from 'lucide-react'
import { Badge } from '@/components/Badge'
import type { BadgeColor } from '@/components/Badge'

export type StatusCellProps = {
  children: ReactNode
  color?: BadgeColor
  icon?: ReactNode
  /** Shows a trailing info icon with this text in a native tooltip on hover — matches the
   * "status with icon and info" reference cell. */
  info?: string
}

// Thin wrapper around Badge — exists so table column defs read clearly
// (`cell: () => <StatusCell color="positive">Paid</StatusCell>`) and to leave a seam for
// table-specific defaults later without touching Badge itself.
export function StatusCell({ children, color = 'neutral', icon, info }: StatusCellProps) {
  return (
    <div className="flex items-center gap-[var(--space-4)]">
      <Badge color={color} icon={icon}>
        {children}
      </Badge>
      {info && (
        <span
          title={info}
          aria-label={info}
          className="inline-flex items-center justify-center text-muted-foreground cursor-help"
        >
          <Info size={12} />
        </span>
      )}
    </div>
  )
}
