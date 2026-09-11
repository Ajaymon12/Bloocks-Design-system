import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

// A separate primitive from ui/dropdown-menu.tsx on purpose: Radix DropdownMenu owns keyboard
// input for its own typeahead-to-select behavior, which fights a real <input> rendered inside
// its content (e.g. a search box). Popover has no such typeahead handling, so it's the right
// engine for any floating panel that contains a live text input — Combobox and FilterDropdown,
// not the plain Actions menu (which stays on DropdownMenu).
export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-[var(--radius-12)] border border-[var(--color-popover-border)] bg-card',
          'shadow-[var(--shadow-popover)] font-[family-name:var(--font-family-primary)]',
          'data-[state=open]:animate-[popover-in_120ms_ease-out]',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
