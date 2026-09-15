import { useId } from 'react'
import { Badge } from '@/components/Badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { FilterOption } from '../types'

export type OptionChecklistProps = {
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  /** Names the group for assistive tech, e.g. "Account type" or "Selected". */
  accessibilityLabel: string
  className?: string
}

/** One option per row: its label (or coloured Badge) on the left, the checkbox on the right, as in
 * the All filters sample — deliberately not FilterDropdown's checkbox-first row, which predates the
 * sample. The whole row is the click target via `<label htmlFor>`, and ids come from `useId` so two
 * panels mounted at once can't collide. */
export function OptionChecklist({ options, selected, onToggle, accessibilityLabel, className }: OptionChecklistProps) {
  const baseId = useId()

  return (
    <div role="group" aria-label={accessibilityLabel} className={cn('flex flex-col gap-[var(--space-2)]', className)}>
      {options.map((option, index) => {
        const id = `${baseId}-${index}`
        const isChecked = selected.includes(option.value)
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'flex min-h-[var(--space-40)] items-center justify-between gap-[var(--space-12)] rounded-[var(--radius-6)]',
              'px-[var(--space-8)] py-[var(--space-4)]',
              option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
            )}
          >
            {option.color ? (
              <Badge color={option.color} size="md" maxWidth={200}>
                {option.label}
              </Badge>
            ) : (
              <span
                className={cn(
                  'min-w-0 truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
                  isChecked ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {option.label}
              </span>
            )}
            <Checkbox id={id} checked={isChecked} disabled={option.disabled} onCheckedChange={() => onToggle(option.value)} />
          </label>
        )
      })}
    </div>
  )
}
