import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — keep src/foundations/usedIcons.ts in sync.
import { ChevronDown, ChevronRight, CircleCheck, Plus, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterChip } from '@/components/FilterChip'
import { PanelSearch } from '@/components/ui/panel-search'

export type TreeDropdownItem = { id: string; label: string; children?: TreeDropdownItem[]; disabled?: boolean }

export type TreeDropdownProps = {
  items: TreeDropdownItem[]
  /** The selected item's id (single select). */
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  /** Enables adding: an "Add item" footer (adds at the root) and a "+" on each row, shown on hover,
   * that adds inside that row. Fires once the new item has been named; the parent owns `items`, so it should insert the item under `parentId` (null = root).
   * The new item is selected automatically. */
  onAddItem?: (item: TreeDropdownItem, parentId: string | null) => void
  searchPlaceholder?: string
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
  searchPlaceholder,
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
      <PopoverContent className="w-[248px] p-0">
        <TreeDropdownPanel items={items} selected={selected} onChange={commit} onAddItem={onAddItem} searchPlaceholder={searchPlaceholder} />
      </PopoverContent>
    </Popover>
  )
}

export type TreeDropdownPanelProps = {
  items: TreeDropdownItem[]
  selected: string | null
  onChange: (value: string | null) => void
  onAddItem?: (item: TreeDropdownItem, parentId: string | null) => void
  searchPlaceholder?: string
}

/** Where the inline "name the new item" input currently sits: under a parent, or at the root. */
type Draft = { parentId: string | null }

/** The panel on its own — search on top, the tree, then the "Add item" footer — without a trigger or popover. */
export function TreeDropdownPanel({ items, selected, onChange, onAddItem, searchPlaceholder = 'Search…' }: TreeDropdownPanelProps) {
  const treeId = useId()
  const [query, setQuery] = useState('')
  // Start with the path to the current selection expanded, so re-opening lands where you left off.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set((selected && findPath(items, selected)?.slice(0, -1).map((item) => item.id)) || []),
  )
  const [draft, setDraft] = useState<Draft | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(selected ?? items[0]?.id ?? null)
  const nextId = useRef(1)
  const treeRef = useRef<HTMLUListElement>(null)
  // Focus starts in the search box; rows only take DOM focus once the user moves into the tree.
  const moveFocus = useRef(false)

  const trimmed = query.trim().toLowerCase()
  const shownItems = trimmed ? filterTree(items, trimmed) : items
  const visible = flattenVisible(shownItems, expanded)

  useEffect(() => {
    if (!focusedId || !moveFocus.current) return
    moveFocus.current = false
    treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(focusedId)}"]`)?.focus()
    // Only move DOM focus when the roving focus changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedId])

  function focusRow(id: string | null | undefined) {
    if (!id) return
    moveFocus.current = true
    setFocusedId(id)
    // Same id as before: the effect won't re-run, so focus it directly.
    if (id === focusedId) treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)?.focus()
  }

  function handleQueryChange(next: string) {
    setQuery(next)
    const nextTrimmed = next.trim().toLowerCase()
    if (!nextTrimmed) return
    // Open every parent on the way to a match, so matches are never hidden inside a collapsed row.
    // They stay open after the search is cleared, which shows where the match lives.
    const filtered = filterTree(items, nextTrimmed)
    setExpanded((previous) => new Set([...previous, ...parentIds(filtered)]))
    // Roving focus lands on the first real match (not an ancestor shown for context).
    const rows = flattenVisible(filtered, new Set(parentIds(filtered)))
    setFocusedId((rows.find((entry) => entry.item.label.toLowerCase().includes(nextTrimmed)) ?? rows[0])?.item.id ?? null)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusRow(visible.find((entry) => entry.item.id === focusedId)?.item.id ?? visible[0]?.item.id)
    } else if (event.key === 'Enter' && trimmed) {
      // Enter picks the first selectable match, so "type, Enter" is enough.
      event.preventDefault()
      // Ancestors shown only for context don't count — the first row whose own label matches.
      const first = visible.find((entry) => !entry.item.disabled && entry.item.label.toLowerCase().includes(trimmed))
      if (first) onChange(first.item.id)
    }
  }

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
    // The new row must be visible, so leave search. Open the parent so the row shows up where it
    // will live, like creating a file in a folder.
    setQuery('')
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
    focusRow(item.id)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, entry: VisibleEntry) {
    const index = visible.findIndex((candidate) => candidate.item.id === entry.item.id)
    const hasChildren = Boolean(entry.item.children?.length)
    const isOpen = expanded.has(entry.item.id)
    switch (event.key) {
      case 'ArrowDown':
        focusRow(visible[index + 1]?.item.id)
        break
      case 'ArrowUp':
        // Up from the first row goes back to the search box.
        if (index === 0) document.getElementById(`${treeId}-search`)?.focus()
        else focusRow(visible[index - 1]?.item.id)
        break
      case 'ArrowRight':
        if (hasChildren && !isOpen) toggleExpanded(entry.item.id, true)
        else if (hasChildren) focusRow(visible[index + 1]?.item.id)
        break
      case 'ArrowLeft':
        if (hasChildren && isOpen) toggleExpanded(entry.item.id, false)
        else focusRow(entry.parentId)
        break
      case 'Home':
        focusRow(visible[0]?.item.id)
        break
      case 'End':
        focusRow(visible.at(-1)?.item.id)
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
                // Explicit name, so the row's "+" button doesn't leak into it on hover.
                aria-label={item.label}
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
                  'group/row mx-[var(--space-8)] flex h-[28px] items-center gap-[var(--space-8)] rounded-[var(--radius-6)] py-[var(--space-4)] pr-[var(--space-8)] outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
                  // Figma "Dropdown single select": the chosen row sits on the light primary tint.
                  isSelected && 'bg-[var(--color-primary-subtle)] hover:bg-[var(--color-primary-subtle)]',
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
                    'min-w-0 flex-1 truncate text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-foreground',
                  )}
                >
                  <HighlightedLabel label={item.label} query={trimmed} />
                </span>
                {onAddItem && !item.disabled && (
                  // Faded in on hover or while the row has keyboard focus, so rows stay clean at rest. Opacity, not
                  // display, so screen readers can still reach it.
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`Add item inside ${item.label}`}
                    title="Add item inside"
                    onClick={(event) => {
                      event.stopPropagation()
                      startAdding(item.id)
                    }}
                    className="flex size-[16px] shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-4)] border-0 bg-transparent p-0 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                )}
                {isSelected && <CircleCheck size={16} className="shrink-0 text-primary" aria-hidden="true" />}
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
      <PanelSearch
        value={query}
        onChange={handleQueryChange}
        placeholder={searchPlaceholder}
        inputProps={{
          id: `${treeId}-search`,
          autoFocus: true,
          'aria-label': 'Search items',
          'aria-controls': `${treeId}-tree`,
          onKeyDown: handleSearchKeyDown,
        }}
      />
      {shownItems.length === 0 && !draft ? (
        <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center">
          <SearchX size={20} className="text-muted-foreground" aria-hidden="true" />
          <p className="text-[length:var(--text-body-3-size)] text-muted-foreground">No matches for “{query}”</p>
        </div>
      ) : (
        <ul
          ref={treeRef}
          id={`${treeId}-tree`}
          role="tree"
          aria-label="Items"
          className="dropdown-scroll m-0 max-h-[288px] list-none overflow-y-auto p-0 py-[var(--space-4)]"
        >
          {renderLevel(shownItems, null, 0)}
        </ul>
      )}
      {onAddItem && (
        // Footer, like FilterDropdown's: adding a top-level item. Adding inside an item is the "+"
        // on that row.
        <div className="border-t border-[var(--color-table-border)] px-[var(--space-8)] py-[var(--space-4)]">
          <button
            type="button"
            onClick={() => startAdding(null)}
            className="flex h-[28px] w-full cursor-pointer items-center gap-[var(--space-8)] rounded-[var(--radius-6)] border-0 bg-transparent px-[var(--space-8)] text-left text-[length:var(--text-body-3-size)] font-medium text-primary hover:bg-[var(--color-surface-hover)]"
          >
            <Plus size={16} aria-hidden="true" />
            Add item
          </button>
        </div>
      )}
    </>
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

/** Bolds the part of `label` that matches the search, so it's clear why a row is showing. */
function HighlightedLabel({ label, query }: { label: string; query: string }) {
  const start = query ? label.toLowerCase().indexOf(query) : -1
  if (start < 0) return <>{label}</>
  const end = start + query.length
  return (
    <>
      {label.slice(0, start)}
      <mark className="bg-transparent font-semibold text-foreground">{label.slice(start, end)}</mark>
      {label.slice(end)}
    </>
  )
}

/** Keeps items whose label matches (with their whole subtree) plus the ancestors leading to them. */
function filterTree(items: TreeDropdownItem[], query: string): TreeDropdownItem[] {
  return items.flatMap((item) => {
    if (item.label.toLowerCase().includes(query)) return [item]
    const children = item.children ? filterTree(item.children, query) : []
    return children.length > 0 ? [{ ...item, children }] : []
  })
}

/** Ids of every item that has children. */
function parentIds(items: TreeDropdownItem[]): string[] {
  return items.flatMap((item) => (item.children?.length ? [item.id, ...parentIds(item.children)] : []))
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
