import { useState } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PanelSearch } from '@/components/ui/panel-search'
import { Checkbox } from '@/components/ui/checkbox'
import { FilterChip } from '@/components/FilterChip'

export type FilterDropdownOption = { value: string; label: string; disabled?: boolean }
export type FilterDropdownGroup = { label: string; options: FilterDropdownOption[] }

export type FilterDropdownProps = {
  groups: FilterDropdownGroup[]
  /** `'multi'` (default) allows any number of selections across all groups; `'single'` allows one. */
  mode?: 'single' | 'multi'
  value?: string[]
  defaultValue?: string[]
  /** Fires immediately on every toggle — filtering is live, there's no Apply step. */
  onChange?: (value: string[]) => void
  /** Fires when "Reset" clears every selection at once. */
  onReset?: () => void
  searchPlaceholder?: string
  /** Closed-state trigger text, e.g. "Department". */
  triggerLabel: string
  accessibilityLabel: string
  isDisabled?: boolean
  className?: string
}

export function FilterDropdown({
  groups,
  mode = 'multi',
  value,
  defaultValue = [],
  onChange,
  onReset,
  searchPlaceholder = 'Search…',
  triggerLabel,
  accessibilityLabel,
  isDisabled = false,
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // Uncontrolled fallback, so the component still works without a `value` prop.
  const [internal, setInternal] = useState<string[]>(defaultValue)
  const selected = value ?? internal

  function commit(next: string[]) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  function toggle(optionValue: string) {
    if (mode === 'single') {
      commit(selected.includes(optionValue) ? [] : [optionValue])
      return
    }
    commit(
      selected.includes(optionValue)
        ? selected.filter((entry) => entry !== optionValue)
        : [...selected, optionValue],
    )
  }

  function reset() {
    if (value === undefined) setInternal([])
    onReset?.()
    onChange?.([])
  }

  const allOptions = groups.flatMap((group) => group.options)
  const selectedLabels = allOptions.filter((option) => selected.includes(option.value)).map((o) => o.label)

  const trimmed = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      options: trimmed ? group.options.filter((option) => option.label.toLowerCase().includes(trimmed)) : group.options,
    }))
    .filter((group) => group.options.length > 0)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (isDisabled) return
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        {/* The trigger is the shared FilterChip, so this and any other filter surface (menu, date
            picker) present one consistent control. Its clear (×) resets without opening the panel. */}
        <FilterChip
          label={triggerLabel}
          value={selectedLabels}
          selectionType={mode === 'single' ? 'single' : 'multiple'}
          onClearButtonClick={reset}
          isDisabled={isDisabled}
          aria-label={accessibilityLabel}
          className={className}
        />
      </PopoverTrigger>

      <PopoverContent className="w-[248px] p-0">
        <PanelSearch value={query} onChange={setQuery} placeholder={searchPlaceholder} inputProps={{ autoFocus: true }} />

        <div className="max-h-[288px] overflow-y-auto py-[var(--space-4)]">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center">
              <SearchX size={20} className="text-muted-foreground" aria-hidden="true" />
              <p className="text-[length:var(--text-body-3-size)] text-muted-foreground">No matches for “{query}”</p>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const groupValues = group.options.filter((option) => !option.disabled).map((option) => option.value)
              const allSelected = groupValues.length > 0 && groupValues.every((entry) => selected.includes(entry))

              return (
                <div key={group.label} className="pb-[var(--space-4)]">
                  {/* Sticky so the group stays identifiable while scrolling a long list. */}
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-[var(--space-8)] bg-card px-[var(--space-12)] pb-[var(--space-4)] pt-[var(--space-8)]">
                    <span className="text-[length:var(--text-body-4-size)] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      {group.label}
                    </span>
                    {mode === 'multi' && groupValues.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          commit(
                            allSelected
                              ? selected.filter((entry) => !groupValues.includes(entry))
                              : [...new Set([...selected, ...groupValues])],
                          )
                        }
                        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-body-4-size)] font-medium text-primary hover:underline"
                      >
                        {allSelected ? 'Clear' : 'Select all'}
                      </button>
                    )}
                  </div>

                  {group.options.map((option) => {
                    const id = `${group.label}-${option.value}`
                    const isChecked = selected.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        htmlFor={id}
                        className={cn(
                          'mx-[var(--space-8)] flex items-center gap-[var(--space-8)] rounded-[var(--radius-6)]',
                          'px-[var(--space-8)] py-[var(--space-4)]',
                          option.disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:bg-[var(--color-bg-subtle)]',
                        )}
                      >
                        <Checkbox
                          id={id}
                          checked={isChecked}
                          disabled={option.disabled}
                          onCheckedChange={() => toggle(option.value)}
                        />
                        <span
                          className={cn(
                            'truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
                            isChecked ? 'font-medium text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer only exists while there's something to reset — no dead chrome otherwise. */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between gap-[var(--space-8)] border-t border-[var(--color-table-border)] px-[var(--space-12)] py-[var(--space-8)]">
            <span className="text-[length:var(--text-body-4-size)] text-muted-foreground">
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-body-4-size)] font-medium text-primary hover:underline"
            >
              Reset
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
