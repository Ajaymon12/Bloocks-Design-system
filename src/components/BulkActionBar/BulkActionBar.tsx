import { useCallback, useEffect, useRef, useState } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { CheckCheck, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { Combobox } from '@/components/Combobox/Combobox'
import type { ComboboxOption } from '@/components/Combobox/Combobox'
import { cn } from '@/lib/utils'

// Figma: Karbon - AI Accountant → bulk action bar (node 24444:61902)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=24444-61902
// Behaviour per Korefi Table Standardization v1.5, §7.6: a count, "Select all N matching", bulk edit
// of editable fields, Delete, and module-specific actions supplied by the caller.
//
// Deliberate departures: the bulk-edit fields are the system's Combobox (searchable — ledger lists
// are long) rather than Figma's plain dropdown fields, and borders use the subtle neutral token
// rather than Figma's blue-200, following the lighter-border direction set for the filter panels.

export type BulkEditField = {
  key: string
  /** Shown as the field's placeholder and accessible name, e.g. "Category". */
  label: string
  options: ComboboxOption[]
  /** The value chosen to apply to every selected row. Empty until picked. */
  value?: string
  isDisabled?: boolean
}

export type BulkAction = {
  label: string
  onClick: () => void
  /** `'primary'` for the main action; defaults to `'secondary'`. */
  variant?: 'primary' | 'secondary'
  isDisabled?: boolean
  isLoading?: boolean
}

export type BulkActionBarProps = {
  selectedCount: number
  /** Rows matching the current filters. With `onSelectAll`, shows "Select all {totalCount}" until
   * everything is selected. */
  totalCount?: number
  onSelectAll?: () => void
  /** Editable fields that can be set on every selected row at once. */
  fields?: BulkEditField[]
  onFieldChange?: (key: string, value: string) => void
  /** Fields visible before the strip scrolls. Default 3. */
  maxVisibleFields?: number
  /** Rendered in order after the fields, e.g. a secondary and a primary action. */
  actions?: BulkAction[]
  /** Shows the delete button. Confirmation (and excluding synced rows, §7.6) is the caller's job. */
  onDelete?: () => void
  deleteLabel?: string
  /** The × — deselects everything, which dismisses the bar. */
  onClearSelection: () => void
  className?: string
}

const FIELD_WIDTH = 130
const FIELD_GAP = 8
// Figma's buttons are 28px tall: label-2 type with 4px vertical padding, tighter than Button's `md`.
const COMPACT_BUTTON = 'py-[var(--space-4)]'

/** Tracks whether a horizontally scrolling element overflows, and whether it's at either end. */
function useScrollEdges() {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ overflows: false, atStart: true, atEnd: true })

  const update = useCallback(() => {
    const element = ref.current
    if (!element) return
    const overflows = element.scrollWidth > element.clientWidth + 1
    const atStart = element.scrollLeft <= 1
    const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1
    setEdges((previous) =>
      previous.overflows === overflows && previous.atStart === atStart && previous.atEnd === atEnd
        ? previous
        : { overflows, atStart, atEnd },
    )
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    // Measuring the DOM is the external system being synchronised with here.
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    return () => observer.disconnect()
  }, [update])

  return { ref, edges, update }
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  fields = [],
  onFieldChange,
  maxVisibleFields = 3,
  actions = [],
  onDelete,
  deleteLabel = 'Delete selected',
  onClearSelection,
  className,
}: BulkActionBarProps) {
  const { ref: stripRef, edges, update } = useScrollEdges()
  const canSelectAll = Boolean(onSelectAll) && totalCount !== undefined && selectedCount < totalCount
  const hasActions = actions.length > 0 || Boolean(onDelete)

  function scrollFields(direction: 1 | -1) {
    stripRef.current?.scrollBy({ left: direction * (FIELD_WIDTH + FIELD_GAP), behavior: 'smooth' })
  }

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        'inline-flex max-w-full items-center gap-[var(--space-8)] rounded-[var(--radius-12)] border border-[var(--color-border-subtle)]',
        'bg-card p-[var(--space-12)] shadow-[var(--shadow-popover)] font-[family-name:var(--font-family-primary)]',
        className,
      )}
    >
      <span
        aria-live="polite"
        className="shrink-0 whitespace-nowrap text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-semibold text-muted-foreground"
      >
        {selectedCount} selected
      </span>

      {canSelectAll && (
        <Button
          variant="secondary"
          leadingIcon={<CheckCheck size={14} />}
          onClick={onSelectAll}
          className={cn(COMPACT_BUTTON, 'shrink-0')}
        >
          Select all {totalCount}
        </Button>
      )}

      {fields.length > 0 && (
        <>
          <Divider />
          {edges.overflows && (
            <ScrollButton label="Scroll fields left" isDisabled={edges.atStart} onClick={() => scrollFields(-1)}>
              <ChevronLeft size={12} aria-hidden="true" />
            </ScrollButton>
          )}
          <div
            ref={stripRef}
            onScroll={update}
            style={{ maxWidth: maxVisibleFields * FIELD_WIDTH + (maxVisibleFields - 1) * FIELD_GAP }}
            // Scrollbar hidden: the chevrons are the affordance, and a native bar would add height.
            className="min-w-0 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max items-center gap-[var(--space-8)]">
              {fields.map((field) => (
                <Combobox
                  key={field.key}
                  size="sm"
                  accessibilityLabel={field.label}
                  placeholder={field.label}
                  searchPlaceholder={`Search ${field.label.toLowerCase()}`}
                  options={field.options}
                  value={field.value ?? ''}
                  onChange={(value) => onFieldChange?.(field.key, value)}
                  isDisabled={field.isDisabled}
                  // Fixed width (FIELD_WIDTH) so every field is the same size and the strip scrolls
                  // by whole fields.
                  className="w-[130px] shrink-0"
                />
              ))}
            </div>
          </div>
          {edges.overflows && (
            <ScrollButton label="Scroll fields right" isDisabled={edges.atEnd} onClick={() => scrollFields(1)}>
              <ChevronRight size={12} aria-hidden="true" />
            </ScrollButton>
          )}
        </>
      )}

      {hasActions && (
        <>
          <Divider />
          <div className="flex shrink-0 items-center gap-[var(--space-12)]">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'secondary'}
                isDisabled={action.isDisabled}
                isLoading={action.isLoading}
                onClick={action.onClick}
                className={COMPACT_BUTTON}
              >
                {action.label}
              </Button>
            ))}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                isDestructive
                leadingIcon={<Trash2 size={16} />}
                accessibilityLabel={deleteLabel}
                onClick={onDelete}
                className="h-[var(--space-28)] w-[var(--space-28)] border-[var(--color-border)]"
              />
            )}
          </div>
        </>
      )}

      <Button
        variant="ghost"
        size="xs"
        leadingIcon={<X size={14} />}
        accessibilityLabel="Clear selection"
        onClick={onClearSelection}
        className="shrink-0 text-muted-foreground hover:bg-[var(--color-bg-subtle)] hover:text-foreground"
      />
    </div>
  )
}

function Divider() {
  return <span aria-hidden="true" className="h-[var(--space-20)] w-px shrink-0 bg-[var(--color-border-subtle)]" />
}

function ScrollButton({
  label,
  isDisabled,
  onClick,
  children,
}: {
  label: string
  isDisabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className="inline-flex size-[var(--space-24)] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-6)] border-0 bg-[var(--color-primary-subtle)] text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
