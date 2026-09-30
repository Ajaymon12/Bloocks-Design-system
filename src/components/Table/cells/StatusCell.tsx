import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Info } from 'lucide-react'
import { Badge } from '@/components/Badge'
import type { BadgeColor } from '@/components/Badge'
import { cn } from '@/lib/utils'
import { useCellProps } from './cellContext'
import type { CellAlign, CellSize } from './cellVariants'
import { CELL_DISABLED_CLASS, CELL_ICON_SLOT, CELL_JUSTIFY, isCellValueEmpty } from './cellVariants'

export type StatusCellProps = {
  children?: ReactNode
  /** Defaults to `'neutral'`, matching Badge. Doubles as this cell's tone — a separate `tone`
   * prop would fight it, so there isn't one. */
  color?: BadgeColor
  icon?: ReactNode
  /** Shows a trailing info icon with this text in a native tooltip on hover — matches the
   * "status with icon and info" reference cell. For a tooltip on the whole cell instead of a
   * separate icon, use `tooltip`. */
  info?: string
  align?: CellAlign
  size?: CellSize
  empty?: ReactNode
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

// Thin wrapper around Badge — exists so table column defs read clearly
// (`cell: () => <StatusCell color="positive">Paid</StatusCell>`) and to leave a seam for
// table-specific defaults later without touching Badge itself.
export function StatusCell({ children, color = 'neutral', icon, info, align, size, empty, isDisabled, tooltip, className }: StatusCellProps) {
  const resolved = useCellProps({ align, size, empty })
  const isEmpty = isCellValueEmpty(children)

  return (
    <div
      title={tooltip}
      className={cn('flex w-full items-center gap-[var(--space-4)]', CELL_JUSTIFY[resolved.align], isDisabled && CELL_DISABLED_CLASS, className)}
    >
      {isEmpty ? (
        <span className="text-muted-foreground">{resolved.empty}</span>
      ) : (
        <>
          <Badge color={color} icon={icon}>
            {children}
          </Badge>
          {info && (
            <span
              role="img"
              title={info}
              aria-label={info}
              className={cn(CELL_ICON_SLOT[resolved.size], 'text-muted-foreground cursor-help')}
            >
              <Info />
            </span>
          )}
        </>
      )}
    </div>
  )
}
