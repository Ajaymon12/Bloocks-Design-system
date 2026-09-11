import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SubTextCellProps = {
  children: ReactNode
  subText: ReactNode
  className?: string
}

export function SubTextCell({ children, subText, className }: SubTextCellProps) {
  return (
    <div className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      <span className="text-foreground truncate">{children}</span>
      <span className="text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground truncate">
        {subText}
      </span>
    </div>
  )
}
