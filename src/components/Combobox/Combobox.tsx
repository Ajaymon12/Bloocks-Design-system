import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown, CircleCheck, Loader2, SearchX, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PanelSearch } from '@/components/ui/panel-search'

export type ComboboxOption = { value: string; label: string; disabled?: boolean }
export type ComboboxSize = 'sm' | 'md'

export type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  /** Trigger text shown when nothing is selected. */
  placeholder?: string
  searchPlaceholder?: string
  /** Required (by convention) when `label` is omitted. */
  accessibilityLabel?: string

  label?: string
  necessityIndicator?: 'required' | 'optional' | 'none'
  helpText?: string
  errorText?: string

  isDisabled?: boolean
  isRequired?: boolean
  isLoading?: boolean
  /** Shows a clear (×) button on the trigger once a value is selected. */
  showClearButton?: boolean
  size?: ComboboxSize
  emptyText?: string
  /** Renders a persistent "+ {label}" row under the list, e.g. "+ Add Customer". */
  onCreate?: { label: string; onSelect: (query: string) => void }
  className?: string
}

const SIZE_PADDING: Record<ComboboxSize, string> = {
  sm: 'py-[var(--space-4)] px-[var(--space-8)]',
  // Figma's 34px field: 6 + 20 + 6 + 2, with 16px side padding — see BaseInput.tsx.
  md: 'py-[6px] px-[var(--space-16)]',
}

const SIZE_TEXT: Record<ComboboxSize, string> = {
  sm: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
}

function firstEnabled(options: ComboboxOption[]) {
  return options.findIndex((option) => !option.disabled)
}

/** Next selectable index in `step` direction, wrapping and skipping disabled options. */
function stepIndex(options: ComboboxOption[], from: number, step: 1 | -1) {
  if (options.length === 0) return -1
  let index = from
  for (let guard = 0; guard < options.length; guard += 1) {
    index += step
    if (index < 0) index = options.length - 1
    if (index >= options.length) index = 0
    if (!options[index].disabled) return index
  }
  return -1
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  accessibilityLabel,
  label,
  necessityIndicator = 'none',
  helpText,
  errorText,
  isDisabled = false,
  isRequired = false,
  isLoading = false,
  showClearButton = false,
  size = 'md',
  emptyText,
  onCreate,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // The keyboard-highlighted option, independent of the committed selection — this is what
  // `aria-activedescendant` points at, so the search input keeps DOM focus the whole time.
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  const baseId = useId()
  const listId = `${baseId}-listbox`
  const labelId = `${baseId}-label`
  const hintId = `${baseId}-hint`

  const selected = options.find((option) => option.value === value)
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed ? options.filter((option) => option.label.toLowerCase().includes(trimmed)) : options

  // Opening lands on the current selection (or the first selectable option); typing re-homes to
  // the top of the new result set.
  useEffect(() => {
    if (!open) return
    const selectedIndex = filtered.findIndex((option) => option.value === value && !option.disabled)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(filtered))
    // Intentionally keyed to open/query only: re-running on every `filtered` identity would fight
    // the user's own arrow-key movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function select(optionValue: string) {
    onChange?.(optionValue)
    setOpen(false)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((prev) => stepIndex(filtered, prev, 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((prev) => stepIndex(filtered, prev, -1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(firstEnabled(filtered))
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(stepIndex(filtered, 0, -1))
        break
      case 'Enter': {
        event.preventDefault()
        const option = filtered[activeIndex]
        if (option && !option.disabled) select(option.value)
        else if (onCreate && filtered.length === 0) {
          onCreate.onSelect(query)
          setOpen(false)
        }
        break
      }
      default:
        break
    }
  }

  const canClear = showClearButton && Boolean(selected) && !isDisabled
  const hintText = errorText ?? helpText

  return (
    <div
      className={cn(
        'flex flex-col gap-[var(--space-4)] font-[family-name:var(--font-family-primary)]',
        // Figma dims the whole field — label, box and hint — when disabled.
        isDisabled && 'opacity-50',
        className,
      )}
    >
      {label && (
        <span
          id={labelId}
          className="text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-medium text-[var(--color-text-secondary)]"
        >
          {/* Figma puts the required asterisk before the label. */}
          {necessityIndicator === 'required' && (
            <span className="text-[var(--color-input-error)]" aria-hidden="true">
              *
            </span>
          )}
          {label}
          {necessityIndicator === 'optional' && (
            <span className="text-[length:var(--text-label-3-size)] font-normal text-muted-foreground"> (optional)</span>
          )}
        </span>
      )}

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (isDisabled) return
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <div className="relative">
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isDisabled}
              aria-label={label ? undefined : accessibilityLabel}
              aria-labelledby={label ? labelId : undefined}
              aria-required={isRequired || undefined}
              aria-invalid={errorText ? true : undefined}
              aria-describedby={hintText ? hintId : undefined}
              className={cn(
                'flex w-full items-center box-border text-left',
                // `no-inner-focus-ring` swaps the global outline for Figma's field ring below.
                'bg-card border rounded-[var(--radius-6)] shadow-[var(--shadow-input)] cursor-pointer no-inner-focus-ring',
                'transition-[border-color,box-shadow] duration-150 ease-in-out',
                SIZE_PADDING[size],
                SIZE_TEXT[size],
                // Figma: a red-600 border for errors; otherwise the primary border inside a 2px ring
                // while focused from the keyboard or open.
                errorText
                  ? 'border-[var(--color-input-error)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-input-error)_25%,transparent)]'
                  : cn(
                      'border-input hover:border-[var(--color-input-border-hover)]',
                      'focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-input-focus-ring)]',
                      'data-[state=open]:border-[var(--color-primary)] data-[state=open]:ring-2 data-[state=open]:ring-[var(--color-input-focus-ring)]',
                    ),
                isDisabled && 'cursor-not-allowed',
                // Room for the trailing cluster below, which sits on top of the trigger.
                canClear ? 'pr-[64px]' : 'pr-[var(--space-40)]',
              )}
            >
              <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                {selected?.label ?? placeholder}
              </span>
            </button>
          </PopoverTrigger>

          {/* Trailing cluster, overlaid on the trigger rather than nested inside it — a <button>
              can't legally contain another. The chevron is decorative and pointer-events-none, so
              clicking it still falls through to the trigger and opens the panel. */}
          <div className="pointer-events-none absolute right-[var(--space-16)] top-1/2 flex -translate-y-1/2 items-center gap-[var(--space-8)]">
            {canClear && (
              <button
                type="button"
                aria-label="Clear selection"
                onClick={() => onChange?.('')}
                className="pointer-events-auto cursor-pointer rounded-[var(--radius-4)] border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={cn('text-muted-foreground transition-transform duration-150', open && 'rotate-180')}
            />
          </div>
        </div>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0">
          <PanelSearch
            value={query}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            inputProps={{
              autoFocus: true,
              role: 'combobox',
              'aria-expanded': true,
              'aria-controls': listId,
              'aria-autocomplete': 'list',
              'aria-activedescendant': activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined,
              onKeyDown: handleSearchKeyDown,
            }}
          />

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label ?? accessibilityLabel}
            className="max-h-[260px] overflow-y-auto p-[var(--space-4)]"
          >
            {isLoading ? (
              <div className="flex items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-12)] text-[length:var(--text-body-3-size)] text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center">
                <SearchX size={20} className="text-muted-foreground" aria-hidden="true" />
                <p className="text-[length:var(--text-body-3-size)] text-muted-foreground">
                  {emptyText ?? (query ? `No matches for “${query}”` : 'No options')}
                </p>
              </div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <div
                    key={option.value}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onClick={() => !option.disabled && select(option.value)}
                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                    className={cn(
                      'flex items-center justify-between gap-[var(--space-8)] rounded-[var(--radius-6)]',
                      'px-[var(--space-12)] py-[var(--space-8)]',
                      'text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)]',
                      option.disabled
                        ? 'cursor-not-allowed text-muted-foreground opacity-50'
                        : 'cursor-pointer text-foreground',
                      isActive && !isSelected && !option.disabled && 'bg-[var(--color-bg-subtle)]',
                      isSelected && 'bg-[var(--color-primary-subtle)] text-primary font-medium',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <CircleCheck size={16} className="shrink-0" />}
                  </div>
                )
              })
            )}
          </div>

          {onCreate && (
            <button
              type="button"
              onClick={() => {
                onCreate.onSelect(query)
                setOpen(false)
              }}
              className="flex w-full cursor-pointer items-center gap-[var(--space-8)] border-t border-[var(--color-table-border)] px-[var(--space-12)] py-[var(--space-10)] text-[length:var(--text-body-2-size)] font-medium text-primary hover:bg-[var(--color-primary-subtle)]"
            >
              + {onCreate.label}
              {query && <span className="truncate text-muted-foreground">“{query}”</span>}
            </button>
          )}
        </PopoverContent>
      </Popover>

      {hintText && (
        <p
          id={hintId}
          className={cn(
            'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)]',
            errorText ? 'text-[var(--color-input-error)]' : 'text-muted-foreground',
          )}
        >
          {hintText}
        </p>
      )}
    </div>
  )
}
