import type { ChangeEvent, ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and either used. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SelectOption } from '@/components/Input/Select'
import { CELL_ICON_SLOT, CELL_PADDING } from './cellVariants'

export type DropdownCellProps = {
  accessibilityLabel: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  /** Rendered before the `<select>`, e.g. a generic category icon. */
  leadingIcon?: ReactNode
  /** Gives the native `<select>` the real `disabled` attribute (keyboard/screen-reader correct,
   * not just dimmed) and dims the whole cell. */
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

export function DropdownCell({
  accessibilityLabel,
  options,
  placeholder,
  leadingIcon,
  isDisabled,
  tooltip,
  className,
  ...props
}: DropdownCellProps) {
  return (
    <div
      title={tooltip}
      className={cn('relative flex w-full h-full items-center', isDisabled && 'opacity-50', className)}
    >
      {leadingIcon && (
        <span className={cn(CELL_ICON_SLOT.md, 'pointer-events-none absolute left-[var(--space-12)] text-muted-foreground')} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <select
        aria-label={accessibilityLabel}
        disabled={isDisabled}
        className={cn(
          'w-full h-full appearance-none bg-transparent border-0 outline-none cursor-pointer text-inherit font-[family-name:var(--font-family-primary)]',
          'disabled:cursor-not-allowed',
          CELL_PADDING,
          'pr-[var(--space-24)]',
          leadingIcon && 'pl-[calc(var(--space-12)+16px+var(--space-8))]',
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-[var(--space-8)] top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
