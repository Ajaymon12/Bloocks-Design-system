import { useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button/Button'
import { PanelSearch } from '@/components/ui/panel-search'
import { cn } from '@/lib/utils'
import {
  areFilterValuesEqual,
  asDateValue,
  compactFilterValues,
  countActiveFilters,
  countFieldSelections,
  isEmptyFilterValue,
} from './filterModel'
import { FieldBody } from './fields/FieldBody'
import { NoMatches } from './fields/FieldMessages'
import type { FilterField, FilterValue, FilterValues } from './types'
import { FilterLabelsProvider } from './useOptionLabels'

// HubSpot-style "All filters" panel — Korefi Table Standardization v1.5, §7.2, and the sample the
// product team shared (Status / Source / Accepted by sidebar, badge checklist, Reset bottom-left).
// A searchable list of every filterable field on the left; the selected field's type-appropriate
// input (§6.1) on the right.
//
// Filtering is LIVE, like FilterDropdown: every tick, Clear and Reset reaches `onChange` straight
// away, so there's no Apply. The one exception is a date — a range still being typed or with only
// one end picked is held back until it's complete, so the table never filters on half a range.

export type AllFiltersPanelProps = {
  fields: FilterField[]
  /** The applied filters. */
  value: FilterValues
  /** Fires on every change with the compacted filters. A date field joins only once its range is
   * complete; until then its previously applied value is kept. */
  onChange: (next: FilterValues) => void
  /** Field shown first. Defaults to the first active field, else the first field. */
  initialFieldKey?: string
  title?: string
  searchPlaceholder?: string
  /** Injectable "today" for date presets, so stories and tests can pin a fixed date. */
  today?: Date
  className?: string
}

const COMPACT_BUTTON = 'py-[var(--space-4)]'
const SIDEBAR_WIDTH = 'w-[200px]'

export function AllFiltersPanel(props: AllFiltersPanelProps) {
  return (
    <FilterLabelsProvider fields={props.fields} values={props.value}>
      <AllFiltersPanelContent {...props} />
    </FilterLabelsProvider>
  )
}

function AllFiltersPanelContent({
  fields,
  value,
  onChange,
  initialFieldKey,
  title = 'Filters',
  searchPlaceholder = 'Search filters',
  today,
  className,
}: AllFiltersPanelProps) {
  const baseId = useId()
  // What the inputs show. It equals the applied value except for a date that isn't complete yet,
  // which lives only here until it is. Seeded on mount: the popover unmounts its content when closed.
  const [draft, setDraft] = useState<FilterValues>(value)
  const [activeKey, setActiveKey] = useState<string | undefined>(
    () => initialFieldKey ?? fields.find((field) => !isEmptyFilterValue(field, value[field.key]))?.key ?? fields[0]?.key,
  )
  const [fieldQuery, setFieldQuery] = useState('')
  // Date fields holding half-typed input.
  const [invalidKeys, setInvalidKeys] = useState<ReadonlySet<string>>(() => new Set())
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const activeField = fields.find((field) => field.key === activeKey) ?? fields[0]
  if (!activeField) return null

  const trimmed = fieldQuery.trim().toLowerCase()
  const visibleFields = trimmed ? fields.filter((field) => field.label.toLowerCase().includes(trimmed)) : fields
  const activeIsVisible = visibleFields.some((field) => field.key === activeField.key)
  const activeCount = countActiveFilters(fields, draft)
  const isActiveFieldEmpty = isEmptyFilterValue(activeField, draft[activeField.key])

  const panelId = `${baseId}-panel`
  const tabId = (key: string) => `${baseId}-tab-${key}`

  /** Shows `nextDraft` and applies everything in it that's ready. */
  function commit(nextDraft: FilterValues, nextInvalid: ReadonlySet<string>) {
    setDraft(nextDraft)
    setInvalidKeys(nextInvalid)

    const ready: FilterValues = { ...nextDraft }
    for (const field of fields) {
      if (field.type !== 'date') continue
      const range = asDateValue(nextDraft[field.key])
      const isIncomplete = nextInvalid.has(field.key) || Boolean(range.from) !== Boolean(range.to)
      if (isIncomplete) ready[field.key] = value[field.key]
    }
    const next = compactFilterValues(fields, ready)
    if (!areFilterValuesEqual(fields, next, value)) onChange(next)
  }

  function changeField(key: string, next: FilterValue | undefined, isValid = true) {
    const nextInvalid = new Set(invalidKeys)
    if (isValid) nextInvalid.delete(key)
    else nextInvalid.add(key)
    commit({ ...draft, [key]: next }, nextInvalid)
  }

  function selectField(key: string) {
    if (key === activeKey) return
    // Leaving a field unmounts its body, discarding any half-typed date along with its invalid flag.
    if (activeKey && invalidKeys.has(activeKey)) {
      const next = new Set(invalidKeys)
      next.delete(activeKey)
      setInvalidKeys(next)
    }
    setActiveKey(key)
  }

  function focusTab(index: number) {
    const field = visibleFields[index]
    if (!field) return
    selectField(field.key)
    tabRefs.current.get(field.key)?.focus()
  }

  // Vertical tablist keyboard model: arrows move and select, Home/End jump to the ends.
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = visibleFields.length - 1
    let target: number | null = null
    if (event.key === 'ArrowDown') target = index >= last ? 0 : index + 1
    else if (event.key === 'ArrowUp') target = index <= 0 ? last : index - 1
    else if (event.key === 'Home') target = 0
    else if (event.key === 'End') target = last
    if (target === null) return
    event.preventDefault()
    focusTab(target)
  }

  return (
    <div
      className={cn(
        // `--field-border` too: inputs set `--border` themselves, so that's what quiets them here.
        'flex flex-col font-[family-name:var(--font-family-primary)] [--border:var(--color-border-subtle)] [--field-border:var(--color-border-subtle)]',
        // Hugs its content — a short checklist makes a short panel — up to a cap, and never taller
        // than the space Radix reports below the trigger. Past that the lists and the pane scroll.
        'max-h-[min(580px,var(--radix-popover-content-available-height,580px))]',
        className,
      )}
    >
      <div className="flex min-h-0 flex-auto">
        {/* Sidebar */}
        <div className={cn('flex min-h-0 shrink-0 flex-col border-r border-[var(--color-border-subtle)]', SIDEBAR_WIDTH)}>
          <p className="m-0 px-[var(--space-16)] pb-[var(--space-4)] pt-[var(--space-16)] text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold text-foreground">
            {title}
          </p>
          <PanelSearch
            value={fieldQuery}
            onChange={setFieldQuery}
            placeholder={searchPlaceholder}
            className="border-b-0 px-[var(--space-16)] py-[var(--space-8)]"
            inputProps={{
              'aria-label': 'Search filters',
              autoFocus: !initialFieldKey,
              onKeyDown: (event) => {
                if (event.key !== 'ArrowDown') return
                event.preventDefault()
                focusTab(0)
              },
            }}
          />

          {visibleFields.length === 0 ? (
            <NoMatches query={fieldQuery} />
          ) : (
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label="Filter fields"
              className="flex min-h-0 flex-auto flex-col gap-[var(--space-2)] overflow-y-auto px-[var(--space-8)] pb-[var(--space-8)] pt-[var(--space-4)]"
            >
              {visibleFields.map((field, index) => {
                const isActive = field.key === activeField.key
                const count = countFieldSelections(field, draft[field.key])
                return (
                  <button
                    key={field.key}
                    ref={(element) => {
                      if (element) tabRefs.current.set(field.key, element)
                      else tabRefs.current.delete(field.key)
                    }}
                    type="button"
                    role="tab"
                    id={tabId(field.key)}
                    // Named explicitly rather than via a visually hidden span: an absolutely positioned
                    // sr-only child is block-level, so name computation would insert a stray space
                    // ("Status , 1 selected").
                    aria-label={count > 0 ? `${field.label}, ${count} selected` : field.label}
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={isActive || (!activeIsVisible && index === 0) ? 0 : -1}
                    onClick={() => selectField(field.key)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={cn(
                      'flex min-h-[var(--space-36,36px)] w-full shrink-0 cursor-pointer items-center justify-between gap-[var(--space-8)]',
                      'rounded-[var(--radius-8)] border-0 px-[var(--space-12)] py-[var(--space-8)] text-left',
                      'text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] transition-colors duration-150',
                      isActive
                        ? 'bg-[var(--color-surface-selected)] font-semibold text-foreground'
                        : 'bg-transparent font-medium text-muted-foreground hover:bg-[var(--color-surface-hover)] hover:text-foreground',
                    )}
                  >
                    <span className="truncate">{field.label}</span>
                    {count > 0 && (
                      <span aria-hidden="true" className="inline-flex shrink-0">
                        <Badge size="sm" color="primary">
                          {count}
                        </Badge>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Active field */}
        <div role="tabpanel" id={panelId} aria-labelledby={tabId(activeField.key)} className="flex min-h-0 w-[312px] flex-col">
          <div className="flex items-center justify-between gap-[var(--space-8)] px-[var(--space-16)] pb-[var(--space-4)] pt-[var(--space-16)]">
            <p className="m-0 truncate text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold text-foreground">
              {activeField.label}
            </p>
            <button
              type="button"
              aria-label={`Clear ${activeField.label}`}
              disabled={isActiveFieldEmpty}
              onClick={() => changeField(activeField.key, undefined)}
              className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
            >
              Clear
            </button>
          </div>
          <div className="flex min-h-0 flex-auto flex-col overflow-y-auto">
            <FieldBody
              key={activeField.key}
              field={activeField}
              value={draft[activeField.key]}
              onChange={(next, isValid) => changeField(activeField.key, next, isValid)}
              today={today}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 border-t border-[var(--color-border-subtle)]">
        <div className={cn('flex items-center border-r border-[var(--color-border-subtle)] px-[var(--space-12)] py-[var(--space-8)]', SIDEBAR_WIDTH)}>
          <Button
            variant="ghost"
            size="sm"
            isDestructive
            isDisabled={activeCount === 0}
            onClick={() => commit({}, new Set())}
            className={COMPACT_BUTTON}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-1 items-center px-[var(--space-16)] py-[var(--space-8)]">
          <span aria-live="polite" className="text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground">
            {activeCount === 0 ? 'No filters applied' : `${activeCount} ${activeCount === 1 ? 'filter' : 'filters'} applied`}
          </span>
        </div>
      </div>
    </div>
  )
}
