import { useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Columns3, GripVertical, Lock, Pin, PinOff, SearchX, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PanelSearch } from '@/components/ui/panel-search'
import { Checkbox } from '@/components/ui/checkbox'

// Figma: Karbon - AI Accountant → "Chargeback columns"
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=25306-142914
// Every change commits immediately (no Apply step), matching FilterDropdown's live model. The
// footer's two Resets are the only bulk actions.

export type ColumnCustomizerItem = {
  id: string
  label: string
  visible: boolean
  pinned?: boolean
  /** Always visible, not reorderable, pin toggle disabled — renders the lock glyph in place of
   * the grip + checkbox, per the Figma spec's Date / Reviewed rows. */
  locked?: boolean
}

export type ColumnCustomizerPanelProps = {
  items: ColumnCustomizerItem[]
  /** Fires on every toggle, reorder and pin — live, there's no Apply step. */
  onChange: (items: ColumnCustomizerItem[]) => void
  /** Omit to hide the "Reset Width" footer button. */
  onResetWidth?: () => void
  /** Omit to hide the "Reset Default" footer button. */
  onResetDefault?: () => void
  title?: string
  searchPlaceholder?: string
  className?: string
}

export type ColumnCustomizerProps = ColumnCustomizerPanelProps & {
  /** Closed-state trigger text. */
  triggerLabel?: string
  accessibilityLabel?: string
  isDisabled?: boolean
  triggerClassName?: string
}

/** The Figma spec's repeated grip/pin/lock affordance: a 12px icon in a small padded box. Figma
 * says 6px, which isn't a step on our spacing scale — `--space-4` is the nearest one. */
const ICON_BUTTON_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-6)] border-0 bg-transparent p-[var(--space-4)] text-muted-foreground'

function move(items: ColumnCustomizerItem[], from: number, to: number) {
  if (from === to || to < 0 || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Which of the three blocks a row belongs to. Pinning implies visible, so there is no
 * pinned-but-hidden state to represent. */
function groupOf(item: ColumnCustomizerItem) {
  if (!item.visible) return 'hidden'
  return item.pinned ? 'pinned' : 'shown'
}

/** Sorts rows into three contiguous blocks — pinned, then shown, then hidden — so pinning a column
 * lifts it to the top and ticking one on lifts it out of the hidden block. Each block keeps its
 * existing relative order (a stable partition), and locked rows are anchored to their index so the
 * structural first/last columns never drift. */
function regroupRows(items: ColumnCustomizerItem[]) {
  const movable = items.filter((item) => !item.locked)
  const grouped = [
    ...movable.filter((item) => groupOf(item) === 'pinned'),
    ...movable.filter((item) => groupOf(item) === 'shown'),
    ...movable.filter((item) => groupOf(item) === 'hidden'),
  ]
  let next = 0
  return items.map((item) => (item.locked ? item : grouped[next++]))
}

export function ColumnCustomizerPanel({
  items,
  onChange,
  onResetWidth,
  onResetDefault,
  title = 'Columns',
  searchPlaceholder = 'Search…',
  className,
}: ColumnCustomizerPanelProps) {
  const [query, setQuery] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  // Screen-reader narration for reorder/pin, which are otherwise silent visual-only changes.
  const [announcement, setAnnouncement] = useState('')
  const gripRefs = useRef(new Map<string, HTMLButtonElement>())

  const trimmed = query.trim().toLowerCase()
  const visibleRows = trimmed ? items.filter((item) => item.label.toLowerCase().includes(trimmed)) : items
  // Reordering a filtered subset has no coherent meaning — the grips disappear while searching.
  const canReorder = trimmed.length === 0

  function toggleVisible(id: string) {
    const toggled = items.map((item) =>
      // Hiding a column drops its pin too: a column you can't see can't be pinned, and leaving a
      // stale pin behind would resurrect it the next time the column was shown.
      item.id === id ? { ...item, visible: !item.visible, pinned: item.visible ? false : item.pinned } : item,
    )
    onChange(regroupRows(toggled))
    // The row physically jumps between groups, so say so rather than leaving a screen-reader user
    // to discover that the list resequenced under them.
    const item = items.find((entry) => entry.id === id)
    if (item) setAnnouncement(`${item.label} ${item.visible ? 'hidden' : 'shown'}`)
  }

  function togglePinned(item: ColumnCustomizerItem) {
    // Guard as well as disabling the control: keeps the pinned-implies-visible invariant true even
    // if a caller drives this some other way.
    if (!item.visible) return
    const next = !item.pinned
    onChange(regroupRows(items.map((entry) => (entry.id === item.id ? { ...entry, pinned: next } : entry))))
    setAnnouncement(`${item.label} ${next ? 'pinned, moved to the top' : 'unpinned'}`)
  }

  function reorder(from: number, to: number) {
    const next = move(items, from, to)
    if (next === items) return
    onChange(next)
    setAnnouncement(`${items[from].label} moved to position ${to + 1} of ${items.length}`)
  }

  /** Reordering stays inside one block, so a drag can't undo the pinned/shown/hidden grouping. */
  function canDropOn(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return false
    return !items[to].locked && groupOf(items[to]) === groupOf(items[from])
  }

  function handleGripKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number, item: ColumnCustomizerItem) {
    // Alt-modified so the arrows don't fight the browser's own scroll of the panel.
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return
    event.preventDefault()
    const to = event.key === 'ArrowUp' ? index - 1 : index + 1
    if (!canDropOn(index, to)) return
    reorder(index, to)
    // The moved row re-renders at a new position; keep focus on the grip that's still "held".
    requestAnimationFrame(() => gripRefs.current.get(item.id)?.focus())
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault()
    if (dragIndex !== null && canDropOn(dragIndex, index)) reorder(dragIndex, index)
    setDragIndex(null)
    setDropIndex(null)
  }

  return (
    <div className={cn('flex flex-col font-[family-name:var(--font-family-primary)]', className)}>
      <div className="px-[var(--space-16)] pt-[var(--space-16)] pb-[var(--space-4)]">
        <p className="text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] font-semibold text-muted-foreground">
          {title}
        </p>
      </div>

      <PanelSearch
        value={query}
        onChange={setQuery}
        placeholder={searchPlaceholder}
        inputProps={{ autoFocus: true, 'aria-label': `Search ${title.toLowerCase()}` }}
        className="px-[var(--space-16)] py-[var(--space-8)]"
      />

      {visibleRows.length === 0 ? (
        <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center">
          <SearchX size={20} className="text-muted-foreground" aria-hidden="true" />
          <p className="text-[length:var(--text-body-3-size)] text-muted-foreground">No matches for “{query}”</p>
        </div>
      ) : (
        <ul
          className={cn(
            'm-0 max-h-[320px] list-none overflow-y-auto px-[var(--space-10)] py-[var(--space-4)]',
            // The spec draws a slim blue-200 thumb rather than the platform default scrollbar.
            '[scrollbar-width:thin] [scrollbar-color:var(--color-popover-border)_transparent]',
          )}
        >
          {visibleRows.map((item) => {
            const index = items.indexOf(item)
            const draggable = canReorder && !item.locked
            return (
              <li
                key={item.id}
                draggable={draggable}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDropIndex(null)
                }}
                onDragOver={(event) => {
                  if (dragIndex === null || !canDropOn(dragIndex, index)) return
                  event.preventDefault()
                  setDropIndex(index)
                }}
                onDrop={(event) => handleDrop(event, index)}
                className={cn(
                  'group/row flex h-[var(--space-32)] items-center justify-between rounded-[var(--radius-6)] px-[var(--space-4)]',
                  draggable && 'cursor-grab',
                  dragIndex === index && 'opacity-40',
                  dropIndex === index && dragIndex !== index && 'bg-[var(--color-primary-subtle)]',
                )}
              >
                <div className={cn('flex min-w-0 items-center', item.locked ? 'gap-[var(--space-4)]' : 'gap-[var(--space-8)]')}>
                  {item.locked ? (
                    <span className={ICON_BUTTON_CLASS} title="This column can't be hidden or moved">
                      <Lock size={12} aria-hidden="true" />
                    </span>
                  ) : (
                    <div className="flex items-center">
                      {canReorder && (
                        <button
                          type="button"
                          ref={(el) => {
                            if (el) gripRefs.current.set(item.id, el)
                            else gripRefs.current.delete(item.id)
                          }}
                          aria-label={`Reorder ${item.label}`}
                          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                          onKeyDown={(event) => handleGripKeyDown(event, index, item)}
                          className={cn(ICON_BUTTON_CLASS, 'cursor-grab hover:text-foreground')}
                        >
                          <GripVertical size={12} aria-hidden="true" />
                        </button>
                      )}
                      <Checkbox
                        size="sm"
                        id={`col-${item.id}`}
                        checked={item.visible}
                        onCheckedChange={() => toggleVisible(item.id)}
                      />
                    </div>
                  )}
                  {/* The label is the click target for visibility — the 12px box alone is too small. */}
                  <label
                    htmlFor={item.locked ? undefined : `col-${item.id}`}
                    className={cn(
                      'truncate text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] text-foreground',
                      !item.locked && 'cursor-pointer',
                    )}
                  >
                    {item.label}
                  </label>
                </div>

                {/* Locked columns can't be pinned or unpinned, so they get no pin control at all
                    rather than a disabled one — nothing to reach for. */}
                {!item.locked && (
                  <button
                    type="button"
                    disabled={!item.visible}
                    aria-pressed={item.pinned ?? false}
                    aria-label={`${item.pinned ? 'Unpin' : 'Pin'} ${item.label}`}
                    title={item.visible ? undefined : 'Show this column to pin it'}
                    onClick={() => togglePinned(item)}
                    className={cn(
                      ICON_BUTTON_CLASS,
                      'transition-opacity duration-150',
                      // Secondary affordance: revealed on row hover, and on keyboard focus so it
                      // stays reachable by Tab. `opacity-0` leaves it in the a11y tree and
                      // hit-testable, unlike `hidden` — it's only visually quiet.
                      item.pinned
                        ? 'text-primary opacity-100'
                        : 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
                      // A hidden column can't be pinned — the control still appears on hover so the
                      // rule is discoverable, but it's inert and visibly so.
                      item.visible
                        ? 'cursor-pointer hover:bg-[var(--color-bg-subtle)] hover:text-foreground'
                        : 'cursor-not-allowed opacity-0 group-hover/row:opacity-40',
                    )}
                  >
                    {/* The glyph names the action the button performs, matching its aria-label:
                        a pinned column offers "unpin". Presence of an icon at rest already means
                        "pinned" (unpinned rows only reveal theirs on hover), so the struck-through
                        pin can't be misread as the unpinned state. */}
                    {item.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {(onResetWidth || onResetDefault) && (
        <div className="flex items-start gap-[var(--space-10)] border-t border-[var(--color-table-border)] px-[var(--space-16)] pb-[var(--space-12)] pt-[var(--space-8)]">
          {onResetWidth && <FooterButton onClick={onResetWidth}>Reset Width</FooterButton>}
          {onResetDefault && <FooterButton onClick={onResetDefault}>Reset Default</FooterButton>}
        </div>
      )}

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

function FooterButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center gap-[var(--space-8)] rounded-[var(--radius-6)]',
        'border-0 bg-transparent px-[var(--space-4)] py-[var(--space-4)]',
        // nowrap: at the panel's width "Reset Default" otherwise breaks across two lines and
        // knocks the two buttons out of alignment with each other.
        'whitespace-nowrap text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-medium text-muted-foreground',
        'hover:bg-[var(--color-bg-subtle)] hover:text-foreground',
      )}
    >
      <Undo2 size={12} aria-hidden="true" />
      {children}
    </button>
  )
}

/** The panel wrapped in its own trigger + popover, matching how Combobox/FilterDropdown ship. */
export function ColumnCustomizer({
  triggerLabel = 'Columns',
  accessibilityLabel = 'Customize columns',
  isDisabled = false,
  triggerClassName,
  ...panelProps
}: ColumnCustomizerProps) {
  const [open, setOpen] = useState(false)
  const hiddenCount = panelProps.items.filter((item) => !item.visible).length

  return (
    <Popover open={open} onOpenChange={(next) => !isDisabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          aria-label={accessibilityLabel}
          className={cn(
            'inline-flex items-center gap-[var(--space-8)] rounded-[var(--radius-8)] border bg-card',
            'px-[var(--space-12)] py-[var(--space-4)] cursor-pointer',
            'text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] font-medium',
            'transition-[border-color,background-color] duration-150 ease-in-out',
            hiddenCount > 0
              ? 'border-[var(--color-popover-border)] bg-[var(--color-primary-subtle)] text-primary'
              : 'border-border text-foreground hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)]',
            isDisabled && 'cursor-not-allowed opacity-50',
            triggerClassName,
          )}
        >
          <Columns3 size={14} aria-hidden="true" />
          {triggerLabel}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[300px] p-0">
        <ColumnCustomizerPanel {...panelProps} />
      </PopoverContent>
    </Popover>
  )
}
