import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full caption-bottom border-collapse border-t border-b border-[var(--color-table-border)]', className)}
        {...props}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-[var(--color-table-border)]', className)} {...props} />
}

export function TableBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableFooter({ className, ...props }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      className={cn('border-t border-[var(--color-table-border)] bg-[var(--color-bg-subtle)] font-medium', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'group border-b border-[var(--color-table-border)] transition-colors duration-150 ease-in-out',
        className,
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-[var(--space-40)] px-[var(--space-12)] text-left align-middle border-r border-[var(--color-table-border)] last:border-r-0',
        'bg-[var(--color-table-header-bg)]',
        'text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium text-muted-foreground',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'px-[var(--space-12)] py-[var(--space-8)] align-middle border-r border-[var(--color-table-border)] last:border-r-0',
        'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-foreground',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}
