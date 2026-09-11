import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CheckboxSize = 'sm' | 'md'

export function Checkbox({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { size?: CheckboxSize }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer inline-flex items-center justify-center shrink-0 box-border',
        size === 'sm' ? 'size-3' : 'size-4',
        'bg-card border border-border rounded-[var(--radius-4)]',
        'transition-[background-color,border-color] duration-150 ease-in-out',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'hover:border-[var(--color-border-strong)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="inline-flex items-center justify-center leading-none">
        {props.checked === 'indeterminate' ? (
          <Minus size={size === 'sm' ? 9 : 11} />
        ) : (
          <Check size={size === 'sm' ? 9 : 11} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
