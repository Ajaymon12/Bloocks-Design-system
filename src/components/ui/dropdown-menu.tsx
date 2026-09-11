import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[10rem] overflow-hidden rounded-[var(--radius-8)] border border-border bg-card p-[var(--space-4)] shadow-md',
          'font-[family-name:var(--font-family-primary)]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-[var(--space-8)] rounded-[var(--radius-4)]',
        'px-[var(--space-8)] py-[var(--space-8)] text-[length:var(--text-body-3-size)] text-foreground outline-none',
        'data-[highlighted]:bg-[var(--color-bg-subtle)]',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-[var(--space-8)] rounded-[var(--radius-4)]',
        'px-[var(--space-8)] py-[var(--space-8)] text-[length:var(--text-body-3-size)] text-foreground outline-none',
        'data-[highlighted]:bg-[var(--color-bg-subtle)]',
        className,
      )}
      {...props}
    >
      {children}
      {checked && (
        <span className="ml-auto inline-flex text-primary">
          <Check size={14} />
        </span>
      )}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}
