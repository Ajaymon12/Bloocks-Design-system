import { useState } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ListFilter } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { AllFiltersPanel } from './AllFiltersPanel'
import { countActiveFilters } from './filterModel'
import type { FilterField, FilterValues } from './types'

export type AllFiltersButtonProps = {
  fields: FilterField[]
  value: FilterValues
  /** Fires on every change in the panel with the compacted filters — filtering is live. */
  onChange: (next: FilterValues) => void
  today?: Date
  initialFieldKey?: string
  /** Controlled open state — lets an app open the panel on a specific field. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
  isDisabled?: boolean
  className?: string
}

/** The "All filters" trigger + popover. Styled like the Columns toolbar button and tinted, like a
 * selected FilterChip, once any filter is active. */
export function AllFiltersButton({
  fields,
  value,
  onChange,
  today,
  initialFieldKey,
  open: openProp,
  onOpenChange,
  triggerLabel = 'All filters',
  isDisabled = false,
  className,
}: AllFiltersButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const count = countActiveFilters(fields, value)

  function setOpen(next: boolean) {
    if (isDisabled && next) return
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-label={count > 0 ? `${triggerLabel}, ${count} active` : triggerLabel}
          className={cn(
            'inline-flex h-[var(--space-28)] items-center gap-[var(--space-8)] rounded-[var(--radius-8)] border px-[var(--space-12)]',
            'font-[family-name:var(--font-family-primary)] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium',
            'cursor-pointer transition-[border-color,background-color] duration-150 ease-in-out',
            count > 0
              ? 'border-[var(--color-popover-border)] bg-[var(--color-primary-subtle)] text-primary'
              : 'border-border bg-card text-foreground hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]',
            isDisabled && 'cursor-not-allowed opacity-50',
            className,
          )}
        >
          <ListFilter size={14} aria-hidden="true" />
          {triggerLabel}
          {count > 0 && (
            <Badge size="sm" color="primary">
              {count}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={8}
        aria-label={triggerLabel}
        className="w-auto border-[var(--color-border-subtle)] p-0"
      >
        <AllFiltersPanel fields={fields} value={value} today={today} initialFieldKey={initialFieldKey} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
