import { cn } from '@/lib/utils'

export type AvatarCellProps = {
  name: string
  className?: string
}

export function AvatarCell({ name, className }: AvatarCellProps) {
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div className={cn('flex items-center gap-[var(--space-8)]', className)}>
      <span
        className="inline-flex items-center justify-center shrink-0 size-6 rounded-full bg-accent text-primary text-[length:var(--text-caption-1-size)] font-medium"
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="text-foreground truncate">{name}</span>
    </div>
  )
}
