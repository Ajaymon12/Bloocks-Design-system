import { useState } from 'react'
import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterDropdownPanel } from '@/components/FilterDropdown'
import type { SelectOption } from '@/components/Input/Select'
import { CELL_ICON_SLOT, CELL_PADDING } from './cellVariants'

export type DropdownCellProps = {
  accessibilityLabel: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  /** Fires with the newly picked option's value, or `''` when the selection is reset. */
  onChange?: (value: string) => void
  /** Rendered before the trigger text, e.g. a generic category icon. */
  leadingIcon?: ReactNode
  /** Disables the trigger (real `disabled` attribute — keyboard/screen-reader correct, not just
   * dimmed) and dims the whole cell. */
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

/** An inline picker that fills its table cell. Opens the same search-and-checklist panel as
 * `FilterDropdown`, anchored under the cell — pair with `meta: { fillCell: true }` on the column.
 * Holds one value: picking an option replaces it and closes the panel. */
export function DropdownCell({
  accessibilityLabel,
  options,
  value,
  defaultValue = '',
  placeholder = 'Select…',
  onChange,
  leadingIcon,
  isDisabled,
  tooltip,
  className,
}: DropdownCellProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // Uncontrolled fallback, so the cell still works without a `value` prop.
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  const selectedOption = options.find((option) => option.value === current)

  function commit(next: string) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  return (
    <div title={tooltip} className={cn('relative flex w-full h-full items-center', isDisabled && 'opacity-50', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (isDisabled) return
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-label={accessibilityLabel}
            aria-expanded={open}
            disabled={isDisabled}
            className={cn(
              // no-inner-focus-ring: the ring is drawn on the whole cell instead (Table.tsx, fillCell).
              'no-inner-focus-ring flex w-full h-full items-center gap-[var(--space-8)] border-0 bg-transparent text-left text-inherit cursor-pointer font-[family-name:var(--font-family-primary)]',
              'disabled:cursor-not-allowed',
              CELL_PADDING,
              'pr-[var(--space-24)]',
            )}
          >
            {leadingIcon && (
              <span className={cn(CELL_ICON_SLOT.md, 'shrink-0 text-muted-foreground')} aria-hidden="true">
                {leadingIcon}
              </span>
            )}
            <span className={cn('min-w-0 flex-1 truncate', !selectedOption && 'text-muted-foreground')}>
              {selectedOption?.label ?? placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-[var(--space-8)] top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <PopoverContent className="w-[248px] p-0">
          <FilterDropdownPanel
            groups={[{ label: '', options }]}
            mode="single"
            selected={selectedOption ? [selectedOption.value] : []}
            onChange={(next) => {
              commit(next[0] ?? '')
              if (next.length > 0) setOpen(false)
            }}
            onReset={() => commit('')}
            query={query}
            onQueryChange={setQuery}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
