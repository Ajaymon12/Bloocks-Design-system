import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type LinkCellProps = {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

const linkClasses =
  'text-primary no-underline hover:underline truncate text-left bg-transparent border-0 p-0 cursor-pointer'

export function LinkCell({ children, href, onClick, className }: LinkCellProps) {
  if (href) {
    return (
      <a className={cn(linkClasses, className)} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={cn(linkClasses, className)} onClick={onClick}>
      {children}
    </button>
  )
}
