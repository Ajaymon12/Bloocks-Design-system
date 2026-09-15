import { useState } from 'react'
import { FilterChip } from '@/components/FilterChip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterFieldPanel } from './FilterFieldPanel'
import { getFilterChipValue } from './filterModel'
import type { FilterField, FilterValue } from './types'
import { FilterLabelsProvider, useFilterLabels } from './useOptionLabels'

export type QuickFilterChipProps = {
  field: FilterField
  value: FilterValue | undefined
  /** Fires on every change in the chip's panel (filtering is live), or with `undefined` when the
   * chip's × clears it. */
  onChange: (next: FilterValue | undefined) => void
  today?: Date
  isDisabled?: boolean
  className?: string
}

/** A single filter as a chip: FilterChip trigger + that field's live panel. */
export function QuickFilterChip(props: QuickFilterChipProps) {
  return (
    <FilterLabelsProvider fields={[props.field]} values={{ [props.field.key]: props.value }}>
      <QuickFilterChipContent {...props} />
    </FilterLabelsProvider>
  )
}

function QuickFilterChipContent({ field, value, onChange, today = new Date(), isDisabled = false, className }: QuickFilterChipProps) {
  const [open, setOpen] = useState(false)
  const { getLabel } = useFilterLabels()

  return (
    <Popover open={open} onOpenChange={(next) => !isDisabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <FilterChip
          label={field.label}
          value={getFilterChipValue(field, value, getLabel, today)}
          selectionType={field.type === 'date' ? 'single' : 'multiple'}
          onClearButtonClick={() => onChange(undefined)}
          isDisabled={isDisabled}
          aria-label={field.label}
          className={className}
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto border-[var(--color-border-subtle)] p-0">
        <FilterFieldPanel field={field} value={value} today={today} onChange={onChange} />
      </PopoverContent>
    </Popover>
  )
}
