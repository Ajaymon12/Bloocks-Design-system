import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Check, Plus, SearchX } from 'lucide-react'
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
  /** Enables the "Add new" row: fires with the typed label and the group it was added to. The parent
   * owns `groups`, so it should append the option; the new option is selected automatically. */
  onAddOption?: (option: FilterDropdownOption, groupLabel: string) => void
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
  onAddOption,
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

  function reset() {
    if (value === undefined) setInternal([])
    onReset?.()
    onChange?.([])
  }

  const allOptions = groups.flatMap((group) => group.options)
  const selectedLabels = allOptions.filter((option) => selected.includes(option.value)).map((o) => o.label)

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
        <FilterDropdownPanel
          groups={groups}
          mode={mode}
          selected={selected}
          onChange={commit}
          onReset={reset}
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder={searchPlaceholder}
          onAddOption={onAddOption}
        />
      </PopoverContent>
    </Popover>
  )
}

export type FilterDropdownPanelProps = {
  groups: FilterDropdownGroup[]
  mode?: 'single' | 'multi'
  selected: string[]
  /** Fires with the next full selection on every toggle. */
  onChange: (next: string[]) => void
  /** Fires when "Reset" is pressed. The footer only shows while something is selected. */
  onReset: () => void
  query: string
  onQueryChange: (query: string) => void
  searchPlaceholder?: string
  /** See FilterDropdownProps.onAddOption. Omit it and no "Add new" row renders. */
  onAddOption?: (option: FilterDropdownOption, groupLabel: string) => void
}

/** The floating panel itself — search, grouped checkbox list, "N selected · Reset" footer — without
 * a trigger or popover, so FilterDropdown (a chip) and DropdownCell (a table cell) share one look.
 * A group with an empty `label` renders no header, for a flat list. */
export function FilterDropdownPanel({
  groups,
  mode = 'multi',
  selected,
  onChange: commit,
  onReset: reset,
  query,
  onQueryChange,
  searchPlaceholder = 'Search…',
  onAddOption,
}: FilterDropdownPanelProps) {
  // Which group is currently showing the inline "name the new item" input (null = none).
  const [addingIn, setAddingIn] = useState<string | null>(null)

  function addOption(groupLabel: string, rawLabel: string) {
    setAddingIn(null)
    const label = rawLabel.trim()
    if (!label) return
    const existing = groups.flatMap((group) => group.options).find((option) => option.label.toLowerCase() === label.toLowerCase())
    const option = existing ?? { value: label, label }
    if (!existing) onAddOption?.(option, groupLabel)
    // Like naming a new tree item and selecting it right away: the new option ends up ticked.
    if (!selected.includes(option.value)) commit(mode === 'single' ? [option.value] : [...selected, option.value])
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

  const trimmed = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      options: trimmed ? group.options.filter((option) => option.label.toLowerCase().includes(trimmed)) : group.options,
    }))
    .filter((group) => group.options.length > 0)

  // Keyboard: focus stays in the search box the whole time and `aria-activedescendant` points at
  // the highlighted option (the same model as Combobox), so typing and arrowing never fight over
  // focus. Options are addressed by their position in the flat, filtered, enabled list.
  const panelId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const navigable = filteredGroups.flatMap((group) =>
    group.options.filter((option) => !option.disabled).map((option) => ({ group, option })),
  )
  const optionDomId = (groupLabel: string, optionValue: string) => `${panelId}-${groupLabel}-${optionValue}`
  // Opens on the first selected option (so re-opening lands where you left off), else the first.
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstSelected = groups.flatMap((group) => group.options.filter((option) => !option.disabled)).findIndex((option) => selected.includes(option.value))
    return Math.max(0, firstSelected)
  })
  const active = navigable[Math.min(activeIndex, navigable.length - 1)]

  useEffect(() => {
    if (!active) return
    listRef.current
      ?.querySelector<HTMLElement>(`[id="${optionDomId(active.group.label, active.option.value)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.group.label, active?.option.value])

  function handleQueryChange(next: string) {
    onQueryChange(next)
    setActiveIndex(0)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (navigable.length === 0) return
    const last = navigable.length - 1
    switch (event.key) {
      case 'ArrowDown':
        setActiveIndex((previous) => (previous >= last ? 0 : previous + 1))
        break
      case 'ArrowUp':
        setActiveIndex((previous) => (previous <= 0 ? last : previous - 1))
        break
      case 'PageDown':
        setActiveIndex((previous) => Math.min(last, previous + 5))
        break
      case 'PageUp':
        setActiveIndex((previous) => Math.max(0, previous - 5))
        break
      case 'Enter':
        if (active) toggle(active.option.value)
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <>
      <PanelSearch
        value={query}
        onChange={handleQueryChange}
        placeholder={searchPlaceholder}
        inputProps={{
          autoFocus: true,
          role: 'combobox',
          'aria-expanded': true,
          'aria-controls': `${panelId}-list`,
          'aria-activedescendant': active ? optionDomId(active.group.label, active.option.value) : undefined,
          onKeyDown: handleSearchKeyDown,
        }}
      />

      <div ref={listRef} id={`${panelId}-list`} role="listbox" aria-multiselectable={mode === 'multi'} className="max-h-[288px] overflow-y-auto py-[var(--space-4)]">
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
                {group.label && (
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
                )}

                {group.options.map((option) => {
                  const id = `${group.label}-${option.value}`
                  const isChecked = selected.includes(option.value)
                  return (
                    <label
                      key={option.value}
                      htmlFor={mode === 'multi' ? id : undefined}
                      onClick={mode === 'single' && !option.disabled ? () => toggle(option.value) : undefined}
                      id={optionDomId(group.label, option.value)}
                      role="option"
                      aria-selected={isChecked}
                      aria-disabled={option.disabled || undefined}
                      className={cn(
                        'mx-[var(--space-8)] flex items-center gap-[var(--space-8)] rounded-[var(--radius-6)]',
                        'px-[var(--space-8)] py-[var(--space-4)]',
                        option.disabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:bg-[var(--color-bg-subtle)]',
                        // The keyboard-highlighted option, same tint as hover.
                        active?.option === option && 'bg-[var(--color-bg-subtle)]',
                      )}
                    >
                      {mode === 'multi' && (
                        <Checkbox
                          id={id}
                          checked={isChecked}
                          disabled={option.disabled}
                          onCheckedChange={() => toggle(option.value)}
                        />
                      )}
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
                          isChecked ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {option.label}
                      </span>
                      {/* Single select has no checkbox — a trailing tick marks the current choice. */}
                      {mode === 'single' && isChecked && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}
                    </label>
                  )
                })}

                {onAddOption && !trimmed && (
                  addingIn === group.label ? (
                    <AddOptionInput onSubmit={(label) => addOption(group.label, label)} onCancel={() => setAddingIn(null)} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingIn(group.label)}
                      className="mx-[var(--space-8)] flex w-[calc(100%-var(--space-16))] cursor-pointer items-center gap-[var(--space-8)] rounded-[var(--radius-6)] border-0 bg-transparent px-[var(--space-8)] py-[var(--space-4)] text-left text-[length:var(--text-body-3-size)] font-medium text-primary hover:bg-[var(--color-bg-subtle)]"
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add new
                    </button>
                  )
                )}
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
            className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-body-4-size)] font-medium text-destructive hover:underline"
          >
            Reset
          </button>
        </div>
      )}
    </>
  )
}

/** The inline "name the new item" row: focused on mount, Enter (or blur) commits a non-empty name,
 * Escape or an empty blur cancels. */
function AddOptionInput({ onSubmit, onCancel }: { onSubmit: (label: string) => void; onCancel: () => void }) {
  const done = useRef(false)
  function finish(label: string, cancel = false) {
    if (done.current) return
    done.current = true
    if (cancel || !label.trim()) onCancel()
    else onSubmit(label)
  }

  return (
    <div className="mx-[var(--space-8)] px-[var(--space-8)] py-[var(--space-4)]">
      <input
        autoFocus
        aria-label="New item name"
        placeholder="Name new item"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') finish(event.currentTarget.value)
          if (event.key === 'Escape') finish('', true)
        }}
        onBlur={(event) => finish(event.currentTarget.value)}
        className="h-[28px] w-full rounded-[var(--radius-6)] border border-primary bg-card px-[var(--space-8)] text-[length:var(--text-body-3-size)] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
