import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — keep src/foundations/usedIcons.ts in sync.
import { Check, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterChip } from '@/components/FilterChip'

export type TreeDropdownItem = { id: string; label: string; children?: TreeDropdownItem[]; disabled?: boolean }

export type TreeDropdownProps = {
  items: TreeDropdownItem[]
  /** The selected item's id (single select). */
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  /** Enables the "Add root item" / "Add child to selected item" actions. Fires once the new item has
   * been named; the parent owns `items`, so it should insert the item under `parentId` (null = root).
   * The new item is selected automatically. */
  onAddItem?: (item: TreeDropdownItem, parentId: string | null) => void
  /** Closed-state trigger text, e.g. "Folder". */
  triggerLabel: string
  accessibilityLabel: string
  isDisabled?: boolean
  className?: string
}

export function TreeDropdown({
  items,
  value,
  defaultValue = null,
  onChange,
  onAddItem,
  triggerLabel,
  accessibilityLabel,
  isDisabled = false,
  className,
}: TreeDropdownProps) {
  const [open, setOpen] = useState(false)
  // Uncontrolled fallback, so the component still works without a `value` prop.
  const [internal, setInternal] = useState<string | null>(defaultValue)
  const selected = value === undefined ? internal : value

  function commit(next: string | null) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const selectedLabel = selected ? findPath(items, selected)?.at(-1)?.label : undefined

  return (
    <Popover open={open} onOpenChange={(next) => !isDisabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <FilterChip
          label={triggerLabel}
          value={selectedLabel}
          selectionType="single"
          onClearButtonClick={() => commit(null)}
          isDisabled={isDisabled}
          aria-label={accessibilityLabel}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <TreeDropdownPanel items={items} selected={selected} onChange={commit} onAddItem={onAddItem} />
      </PopoverContent>
    </Popover>
  )
}

export type TreeDropdownPanelProps = {
  items: TreeDropdownItem[]
  selected: string | null
  onChange: (value: string | null) => void
  onAddItem?: (item: TreeDropdownItem, parentId: string | null) => void
}

/** Where the inline "name the new item" input currently sits: under a parent, or at the root. */
type Draft = { parentId: string | null }

/** The panel on its own — add actions on top, the tree below — without a trigger or popover. */
export function TreeDropdownPanel({ items, selected, onChange, onAddItem }: TreeDropdownPanelProps) {
  const treeId = useId()
  // Start with the path to the current selection expanded, so re-opening lands where you left off.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set((selected && findPath(items, selected)?.slice(0, -1).map((item) => item.id)) || []),
  )
  const [draft, setDraft] = useState<Draft | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(selected ?? items[0]?.id ?? null)
  const nextId = useRef(1)
  const treeRef = useRef<HTMLUListElement>(null)

  const visible = flattenVisible(items, expanded)

  useEffect(() => {
    if (!focusedId) return
    treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(focusedId)}"]`)?.focus()
    // Only move DOM focus when the roving focus changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedId])

  function toggleExpanded(id: string, shouldBeExpanded?: boolean) {
    setExpanded((previous) => {
      const next = new Set(previous)
      const expand = shouldBeExpanded ?? !next.has(id)
      if (expand) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function startAdding(parentId: string | null) {
    // Open the parent so the new row shows up where it will live, like creating a file in a folder.
    if (parentId) toggleExpanded(parentId, true)
    setDraft({ parentId })
  }

  function finishAdding(label: string | null) {
    const parentId = draft?.parentId ?? null
    setDraft(null)
    if (!label?.trim()) return
    const item = { id: `${treeId}-new-${nextId.current++}`, label: label.trim() }
    onAddItem?.(item, parentId)
    onChange(item.id)
    setFocusedId(item.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, entry: VisibleEntry) {
    const index = visible.findIndex((candidate) => candidate.item.id === entry.item.id)
    const hasChildren = Boolean(entry.item.children?.length)
    const isOpen = expanded.has(entry.item.id)
    switch (event.key) {
      case 'ArrowDown':
        if (visible[index + 1]) setFocusedId(visible[index + 1].item.id)
        break
      case 'ArrowUp':
        if (visible[index - 1]) setFocusedId(visible[index - 1].item.id)
        break
      case 'ArrowRight':
        if (hasChildren && !isOpen) toggleExpanded(entry.item.id, true)
        else if (hasChildren) setFocusedId(entry.item.children![0].id)
        break
      case 'ArrowLeft':
        if (hasChildren && isOpen) toggleExpanded(entry.item.id, false)
        else if (entry.parentId) setFocusedId(entry.parentId)
        break
      case 'Home':
        setFocusedId(visible[0]?.item.id ?? null)
        break
      case 'End':
        setFocusedId(visible.at(-1)?.item.id ?? null)
        break
      case 'Enter':
      case ' ':
        if (!entry.item.disabled) onChange(entry.item.id)
        break
      default:
        return
    }
    event.preventDefault()
  }

  function renderLevel(levelItems: TreeDropdownItem[], parentId: string | null, depth: number) {
    return (
      <>
        {levelItems.map((item) => {
          const hasChildren = Boolean(item.children?.length) || draft?.parentId === item.id
          const isOpen = expanded.has(item.id)
          const isSelected = selected === item.id
          const entry = { item, parentId, depth }
          return (
            <li key={item.id} role="none">
              <div
                role="treeitem"
                data-tree-id={item.id}
                aria-level={depth + 1}
                aria-selected={isSelected}
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-disabled={item.disabled || undefined}
                tabIndex={focusedId === item.id ? 0 : -1}
                onFocus={() => setFocusedId(item.id)}
                onKeyDown={(event) => handleKeyDown(event, entry)}
                onClick={() => !item.disabled && onChange(item.id)}
                style={{ paddingLeft: `calc(var(--space-8) + ${depth} * var(--space-16))` }}
                className={cn(
                  'mx-[var(--space-8)] flex items-center gap-[var(--space-4)] rounded-[var(--radius-6)] py-[var(--space-4)] pr-[var(--space-8)] outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--color-bg-subtle)]',
                  isSelected && 'bg-[var(--color-bg-subtle)]',
                )}
              >
                {/* Fixed-width slot, so leaves line up with their siblings' labels. */}
                <span className="flex size-[16px] shrink-0 items-center justify-center">
                  {hasChildren && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-hidden="true"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleExpanded(item.id)
                      }}
                      className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-muted-foreground"
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)]',
                    isSelected ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
                {isSelected && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}
              </div>

              {hasChildren && isOpen && (
                <ul role="group" className="m-0 list-none p-0">
                  {renderLevel(item.children ?? [], item.id, depth + 1)}
                </ul>
              )}
            </li>
          )
        })}
        {draft && draft.parentId === parentId && (
          <li role="none">
            <NewItemInput depth={depth} onDone={finishAdding} />
          </li>
        )}
      </>
    )
  }

  return (
    <>
      {onAddItem && (
        <div className="flex items-center gap-[var(--space-12)] border-b border-[var(--color-table-border)] px-[var(--space-12)] py-[var(--space-8)]">
          <AddAction onClick={() => startAdding(null)}>Add root item</AddAction>
          <AddAction onClick={() => startAdding(selected)} disabled={selected == null}>
            Add child to selected item
          </AddAction>
        </div>
      )}
      <ul
        ref={treeRef}
        role="tree"
        aria-label="Items"
        className="m-0 max-h-[320px] list-none overflow-y-auto p-0 py-[var(--space-4)]"
      >
        {renderLevel(items, null, 0)}
      </ul>
    </>
  )
}

function AddAction({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex cursor-pointer items-center gap-[var(--space-4)] whitespace-nowrap border-0 bg-transparent p-0 text-[length:var(--text-body-4-size)] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
    >
      <Plus size={14} aria-hidden="true" />
      {children}
    </button>
  )
}

/** The inline "name the new item" row, indented to the level it will be added at: focused and
 * pre-filled with "New item" (selected, so typing replaces it). Enter or blur commits a non-empty
 * name; Escape cancels. */
function NewItemInput({ depth, onDone }: { depth: number; onDone: (label: string | null) => void }) {
  const done = useRef(false)
  function finish(label: string | null) {
    if (done.current) return
    done.current = true
    onDone(label)
  }

  return (
    <div
      className="mx-[var(--space-8)] flex items-center gap-[var(--space-4)] py-[var(--space-2)] pr-[var(--space-8)]"
      style={{ paddingLeft: `calc(var(--space-8) + ${depth} * var(--space-16) + 16px + var(--space-4))` }}
    >
      <input
        autoFocus
        defaultValue="New item"
        onFocus={(event) => event.currentTarget.select()}
        aria-label="New item name"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Enter') finish(event.currentTarget.value)
          if (event.key === 'Escape') {
            // Cancel the add without closing the whole dropdown.
            event.preventDefault()
            finish(null)
          }
        }}
        onBlur={(event) => finish(event.currentTarget.value)}
        className="h-[28px] w-full rounded-[var(--radius-6)] border border-primary bg-card px-[var(--space-8)] text-[length:var(--text-body-3-size)] text-foreground outline-none"
      />
    </div>
  )
}

type VisibleEntry = { item: TreeDropdownItem; parentId: string | null; depth: number }

/** The rows currently on screen, top to bottom — what the arrow keys walk through. */
function flattenVisible(items: TreeDropdownItem[], expanded: Set<string>, parentId: string | null = null, depth = 0): VisibleEntry[] {
  return items.flatMap((item) => [
    { item, parentId, depth },
    ...(item.children && expanded.has(item.id) ? flattenVisible(item.children, expanded, item.id, depth + 1) : []),
  ])
}

/** Root → item chain for `id`, or undefined when it isn't in the tree. */
function findPath(items: TreeDropdownItem[], id: string): TreeDropdownItem[] | undefined {
  for (const item of items) {
    if (item.id === id) return [item]
    const rest = item.children && findPath(item.children, id)
    if (rest) return [item, ...rest]
  }
  return undefined
}

/** Returns a copy of `items` with `item` appended under `parentId` (null = root). Handy for `onAddItem`. */
export function insertTreeItem(items: TreeDropdownItem[], item: TreeDropdownItem, parentId: string | null): TreeDropdownItem[] {
  if (parentId == null) return [...items, item]
  return items.map((entry) =>
    entry.id === parentId
      ? { ...entry, children: [...(entry.children ?? []), item] }
      : entry.children
        ? { ...entry, children: insertTreeItem(entry.children, item, parentId) }
        : entry,
  )
}
