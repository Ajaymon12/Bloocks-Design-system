import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  FilterFn,
  RowData,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { isWithinRange } from '@/lib/date'
import type { DateRangeValue } from '@/lib/date'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { AlignLeft, MoreVertical, WrapText } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table as TableRoot, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ColumnCustomizer } from '@/components/ColumnCustomizer'
import type { ColumnCustomizerItem } from '@/components/ColumnCustomizer'
import { cn } from '@/lib/utils'
import { Pagination } from './Pagination'

// TanStack's own documented pattern for extending column `meta` with app-specific fields.
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Removes the cell's default padding so an inline control (DropdownCell/InputCell) can fill
     * it edge-to-edge instead of sitting double-boxed inside extra whitespace. */
    fillCell?: boolean
    /** Tailwind width class applied to both the header and body cells of this column, e.g. 'w-16'. */
    width?: string
    /** Extra classes applied to just the header cell (e.g. a tinted background). */
    headerClassName?: string
    /** Adds a "⋮" column-options menu with Wrap Text / Clip Text (default) — for columns that
     * regularly hold long text (a Description/Narration column, say). Clip truncates to one line
     * with an ellipsis; Wrap lets the cell grow to multiple lines instead. */
    textWrap?: boolean
    /** Display name for the ColumnCustomizer panel. Needed because `header` is a render function
     * (see `columnHeader()`), not a string — without this the panel falls back to `column.id`. */
    title?: string
    /** Excludes the column from the ColumnCustomizer's controls: always visible, not reorderable,
     * pin toggle disabled. Matches the Figma spec's Date / Reviewed rows. */
    lockColumn?: boolean
    /** Makes `columnHeader(label, { filterable: true })`'s filter icon open a real filter panel.
     * `'date'` opens a range calendar; the column's values must be `Date`s or ISO strings (use
     * `DateCell` to render them). */
    filterType?: 'date'
  }

  /** Registers the custom filters below by name, so a column can say `filterFn: 'dateRange'` or
   * `filterFn: 'anyOf'` and still type-check — TanStack only knows the built-in names otherwise. */
  interface FilterFns {
    dateRange: FilterFn<unknown>
    anyOf: FilterFn<unknown>
  }
}

/** Inclusive, day-granular date-range filter. Registered as a named filterFn so a column can opt
 * in with `filterFn: 'dateRange'`. */
const dateRangeFilter: FilterFn<unknown> = (row, columnId, filterValue: DateRangeValue) => {
  if (!filterValue?.from && !filterValue?.to) return true
  const value = row.getValue(columnId)
  if (value == null) return false
  return isWithinRange(value as Date | string | number, filterValue)
}

/** "Is any of" for enum / entity_ref columns (spec §6.1): the row matches when its value — or any
 * entry of an array value — is one of the selected option values. Exact matches only; TanStack's
 * built-in `arrIncludesSome` does substring matching on scalar cells, which would let "current"
 * match a "current_account" value. */
const anyOfFilter: FilterFn<unknown> = (row, columnId, filterValue: string[]) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true
  const value = row.getValue(columnId)
  if (value == null) return false
  return Array.isArray(value)
    ? value.some((entry) => filterValue.includes(String(entry)))
    : filterValue.includes(String(value))
}
anyOfFilter.autoRemove = (value) => !Array.isArray(value) || value.length === 0

const SELECT_COLUMN_ID = 'select'
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])

export type TableSize = 'sm' | 'md'

const CELL_TEXT_CLASS: Record<TableSize, string> = {
  sm: 'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] tracking-[var(--text-body-4-letter-spacing)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] tracking-[var(--text-body-3-letter-spacing)]',
}

/** What `renderBulkActions` receives — enough to drive a BulkActionBar. */
export type TableBulkActionsContext<TData> = {
  selectedRows: TData[]
  selectedCount: number
  /** Rows matching the current filters, across every page (spec §7.6 "Select all N matching"). */
  totalCount: number
  selectAll: () => void
  clearSelection: () => void
}

export type TableProps<TData> = {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  /** Adds a leading checkbox column (header = select-all/indeterminate, per-row toggle). */
  enableRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  /** Enables click-to-sort headers built with `sortableHeader()`/`columnHeader()`. Default true. */
  enableSorting?: boolean
  pageSize?: number
  emptyState?: ReactNode
  /** Body cell text size — `'sm'` is 12px (`--text-body-4`), `'md'` is 14px (`--text-body-3`,
   * default). Header text stays 12px either way (`--text-label-3`, already the smallest step). */
  size?: TableSize
  /** Lets every column be resized by dragging its right edge, except the row-selection checkbox
   * column and any column def with `enableResizing: false` (set that on an Actions column, for
   * instance). Switches the table to a fixed layout driven by TanStack's own column-sizing state
   * — off by default so tables that don't need it keep their natural content-based widths. */
  enableColumnResizing?: boolean
  /** Renders a "Columns" toolbar button above the grid that opens the `ColumnCustomizer` panel:
   * show/hide, reorder, and pin-left any column. Use `meta.title` to give a column a readable name
   * in the panel and `meta.lockColumn` to exempt it from being hidden, moved or unpinned. */
  enableColumnCustomization?: boolean
  /** Controlled column filters. When provided the table stops keeping its own, so filters set from
   * outside (a FilterBar) and from inside (a column header's date filter) stay in one place. */
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (next: ColumnFiltersState) => void
  /** Content for the left of the toolbar row above the grid, e.g. `<FilterBar />`. The Columns
   * button, when enabled, stays on the right. */
  toolbar?: ReactNode
  /** Renders a floating bar (typically `<BulkActionBar />`) pinned to the bottom of the table while
   * any row is selected. Use with `enableRowSelection`. */
  renderBulkActions?: (context: TableBulkActionsContext<TData>) => ReactNode
  className?: string
}

const SELECT_COLUMN_SIZE = 40

type CellPosition = { row: number; col: number }

export function Table<TData>({
  columns,
  data,
  enableRowSelection = false,
  onRowSelectionChange,
  enableSorting = true,
  pageSize = 20,
  emptyState = 'No data',
  size = 'md',
  enableColumnResizing = false,
  enableColumnCustomization = false,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  toolbar,
  renderBulkActions,
  className,
}: TableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  // Roving-tabindex grid navigation: only the cell at `focusedCell` is a tab stop (tabIndex 0),
  // every other gridcell is -1. `focusedCell` is bookkeeping only — it's updated (a) on `focus`,
  // whenever the browser naturally focuses a cell or a control inside it (click, Tab), and
  // (b) imperatively by the document-level keydown listener below, which calls `.focus()` itself
  // right where it computes the destination. There is deliberately no effect that calls `.focus()`
  // in response to `focusedCell` changing: a `focus` event on a cell bubbles up from any
  // interactive child inside it (e.g. the row-selection Checkbox), so an effect reacting to that
  // would immediately steal focus back to the wrapping `<td>` mid-click and swallow the click.
  // The global :focus-visible ring (tokens.css) renders automatically once a cell actually
  // receives focus — no custom focus-ring class needed here, unlike BaseInput/Select (that hack
  // is only for beating a co-applied plain utility class; nothing here competes with one).
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ row: 0, col: 0 })
  const cellRefs = useRef(new Map<string, HTMLTableCellElement>())
  const headerRefs = useRef(new Map<string, HTMLTableCellElement>())
  const containerRef = useRef<HTMLDivElement>(null)
  const [pinnedOffsets, setPinnedOffsets] = useState<Record<string, number>>({})
  // Per-column Wrap/Clip choice, for columns with `meta: { textWrap: true }`. Absent from a
  // column's entry here means "clip" (the default) — only wrapped columns need to be tracked.
  const [wrappedColumns, setWrappedColumns] = useState<Set<string>>(new Set())
  // Column customization state. All three start empty, which is TanStack's own "nothing
  // overridden" encoding — every column visible, natural order, nothing pinned. That makes
  // "Reset Default" simply clearing all three back to empty.
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] })
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])
  const columnFilters = columnFiltersProp ?? internalColumnFilters

  const resolvedColumns = useMemo(
    () => (enableRowSelection ? [selectColumn<TData>(), ...columns] : columns),
    [enableRowSelection, columns],
  )

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, rowSelection, columnVisibility, columnOrder, columnPinning, columnFilters },
    filterFns: { dateRange: dateRangeFilter, anyOf: anyOfFilter },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnFilters) : updater
      if (columnFiltersProp === undefined) setInternalColumnFilters(next)
      onColumnFiltersChange?.(next)
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: (updater) => {
      setRowSelection((old) => {
        const next = typeof updater === 'function' ? updater(old) : updater
        onRowSelectionChange?.(
          Object.keys(next)
            .filter((key) => next[key])
            .map((key) => data[Number(key)]),
        )
        return next
      })
    },
    enableRowSelection,
    enableSorting,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  })

  const rows = table.getRowModel().rows
  // Visible leaf columns, not `resolvedColumns.length`: once the ColumnCustomizer can hide a
  // column, the raw definition count over-reports and the arrow-key handler below would navigate
  // to a column index that no longer has a cell.
  const colCount = table.getVisibleLeafColumns().length

  // The ColumnCustomizer speaks a flat item list, not TanStack columns — adapt in both directions.
  // The internal row-selection checkbox column is never offered as customizable.
  const customizerItems: ColumnCustomizerItem[] = table
    .getAllLeafColumns()
    .filter((column) => column.id !== SELECT_COLUMN_ID)
    .map((column) => ({
      id: column.id,
      label: column.columnDef.meta?.title ?? column.id,
      visible: column.getIsVisible(),
      pinned: column.getIsPinned() === 'left',
      locked: column.columnDef.meta?.lockColumn ?? false,
    }))

  function applyCustomizerItems(items: ColumnCustomizerItem[]) {
    setColumnVisibility(Object.fromEntries(items.map((item) => [item.id, item.visible])))
    // The select column always leads, so it's prepended rather than being part of the sortable list.
    setColumnOrder([
      ...(enableRowSelection ? [SELECT_COLUMN_ID] : []),
      ...items.map((item) => item.id),
    ])

    const pinned = items.filter((item) => item.pinned && !item.locked).map((item) => item.id)
    // Locked columns at the head of the list are the table's anchor, and the selection checkbox
    // sits left of everything. Both have to be frozen ahead of whatever the user pins, or pinning
    // would slide a column in front of the one the panel shows first — the panel and the grid
    // would then disagree about column order. Applied only when something is actually pinned, so
    // an unpinned table keeps its natural layout and draws no freeze line.
    const leadingLocked: string[] = []
    for (const item of items) {
      if (!item.locked) break
      leadingLocked.push(item.id)
    }
    setColumnPinning({
      left:
        pinned.length === 0
          ? []
          : [...(enableRowSelection ? [SELECT_COLUMN_ID] : []), ...leadingLocked, ...pinned],
      right: [],
    })
  }

  function resetColumnsToDefault() {
    setColumnVisibility({})
    setColumnOrder([])
    setColumnPinning({ left: [], right: [] })
  }

  // Sticky offsets for left-pinned columns, measured rather than taken from TanStack's
  // `column.getStart('left')`: that sums `column.getSize()`, which is the 150px default unless
  // resizing is on, so it only matches reality in the fixed-layout case. Header cell `offsetWidth`
  // is correct either way — a sticky element's *width* is unaffected by being stuck, only its
  // position is, so this stays right even while the table is scrolled.
  const pinnedLeftIds = columnPinning.left ?? []
  const columnSizing = table.getState().columnSizing
  useLayoutEffect(() => {
    if (pinnedLeftIds.length === 0) {
      setPinnedOffsets((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      return
    }
    let offset = 0
    const next: Record<string, number> = {}
    for (const column of table.getLeftVisibleLeafColumns()) {
      next[column.id] = offset
      offset += headerRefs.current.get(column.id)?.offsetWidth ?? 0
    }
    setPinnedOffsets((prev) => {
      const keys = Object.keys(next)
      const same = keys.length === Object.keys(prev).length && keys.every((key) => prev[key] === next[key])
      return same ? prev : next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedLeftIds.join(','), columnVisibility, columnOrder, columnSizing, size, rows.length])

  function pinnedStyle(column: Column<TData, unknown>): CSSProperties | undefined {
    if (column.getIsPinned() !== 'left') return undefined
    return { position: 'sticky', left: pinnedOffsets[column.id] ?? 0, zIndex: 2 }
  }

  /** The freeze line: a heavier border marking where the pinned block ends. */
  function pinnedBorderClass(column: Column<TData, unknown>) {
    return column.getIsPinned() === 'left' && column.getIsLastColumn('left')
      ? 'border-r-2 border-r-[var(--color-border-strong)]'
      : undefined
  }

  // A native, document-level *capture* listener — not a React onKeyDownCapture prop on the cell.
  // A JSX capture handler on the <td> is not reliably invoked when a nested interactive control
  // (e.g. Radix's Checkbox) attaches its own native listener directly to its DOM node: that
  // listener can win the race and stopPropagation() before it ever reaches React's per-fiber
  // capture simulation. Attaching directly on `document` with `capture: true` is the true
  // outermost native capture listener, so it always runs first regardless of what any descendant
  // does — Home/End/Arrow keys should always mean "move the active grid cell" in this table.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!NAV_KEYS.has(event.key)) return
      const active = document.activeElement
      if (!containerRef.current?.contains(active)) return
      // The toolbar (filter chips, Columns) and the bulk action bar live inside the container but
      // aren't part of the grid: arrow keys there belong to their own controls, not cell navigation.
      if (active?.closest('[data-table-toolbar], [data-table-bulk-actions]')) return

      const current = active?.closest<HTMLTableCellElement>('td[data-row][data-col]')
      const row = Number(current?.dataset.row ?? 0)
      const col = Number(current?.dataset.col ?? 0)
      let nextRow = row
      let nextCol = col
      switch (event.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          nextRow = Math.min(rows.length - 1, row + 1)
          break
        case 'ArrowLeft':
          nextCol = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          nextCol = Math.min(colCount - 1, col + 1)
          break
        case 'Home':
          nextCol = 0
          break
        case 'End':
          nextCol = colCount - 1
          break
      }

      event.preventDefault()
      event.stopPropagation()
      setFocusedCell({ row: nextRow, col: nextCol })
      cellRefs.current.get(`${nextRow}-${nextCol}`)?.focus()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [rows.length, colCount])

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-[var(--space-8)]', className)}>
      {(toolbar || enableColumnCustomization) && (
        <div data-table-toolbar="" className="flex items-start justify-between gap-[var(--space-8)]">
          {/* Always rendered, even empty, so the Columns button keeps its place on the right. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[var(--space-8)]">{toolbar}</div>
          {enableColumnCustomization && (
            <ColumnCustomizer
              items={customizerItems}
              onChange={applyCustomizerItems}
              onResetWidth={enableColumnResizing ? () => table.resetColumnSizing() : undefined}
              onResetDefault={resetColumnsToDefault}
            />
          )}
        </div>
      )}
      <TableRoot
        role="grid"
        className={enableColumnResizing ? 'table-fixed w-auto' : undefined}
        style={enableColumnResizing ? { width: table.getTotalSize() } : undefined}
      >
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  role="columnheader"
                  ref={(el) => {
                    if (el) headerRefs.current.set(header.column.id, el)
                    else headerRefs.current.delete(header.column.id)
                  }}
                  style={{
                    ...(enableColumnResizing ? { width: header.getSize() } : undefined),
                    ...pinnedStyle(header.column),
                  }}
                  className={cn(
                    'relative',
                    header.column.id === SELECT_COLUMN_ID && !enableColumnResizing && 'w-10',
                    header.column.columnDef.meta?.width,
                    header.column.columnDef.meta?.headerClassName,
                    pinnedBorderClass(header.column),
                  )}
                >
                  <div className="flex items-center justify-between gap-[var(--space-4)]">
                    <div className="min-w-0 flex-1">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.columnDef.meta?.textWrap && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center p-[var(--space-2)] border-0 bg-transparent text-muted-foreground cursor-pointer hover:text-foreground"
                            aria-label={`${header.column.id} column options`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuCheckboxItem
                            checked={wrappedColumns.has(header.column.id)}
                            onCheckedChange={() =>
                              setWrappedColumns((prev) => {
                                const next = new Set(prev)
                                next.add(header.column.id)
                                return next
                              })
                            }
                          >
                            <WrapText size={14} />
                            Wrap Text
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={!wrappedColumns.has(header.column.id)}
                            onCheckedChange={() =>
                              setWrappedColumns((prev) => {
                                const next = new Set(prev)
                                next.delete(header.column.id)
                                return next
                              })
                            }
                          >
                            <AlignLeft size={14} />
                            Clip Text
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {enableColumnResizing && header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${header.column.id} column`}
                      className={cn(
                        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                        'hover:bg-primary',
                        header.column.getIsResizing() && 'bg-primary',
                      )}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={colCount}
                className={cn('text-center text-muted-foreground py-[var(--space-32)]', CELL_TEXT_CLASS[size])}
              >
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                role="row"
                className={cn(
                  'hover:bg-[var(--color-table-row-hover)]',
                  row.getIsSelected() && 'bg-[var(--color-primary-subtle)]',
                )}
              >
                {row.getVisibleCells().map((cell, colIndex) => {
                  const canWrap = cell.column.columnDef.meta?.textWrap
                  const isWrapped = canWrap && wrappedColumns.has(cell.column.id)
                  const isClipped = (enableColumnResizing && cell.column.getCanResize()) || (canWrap && !isWrapped)

                  return (
                    <TableCell
                      key={cell.id}
                      ref={(el) => {
                        if (el) cellRefs.current.set(`${rowIndex}-${colIndex}`, el)
                        else cellRefs.current.delete(`${rowIndex}-${colIndex}`)
                      }}
                      role="gridcell"
                      data-row={rowIndex}
                      data-col={colIndex}
                      tabIndex={focusedCell.row === rowIndex && focusedCell.col === colIndex ? 0 : -1}
                      onFocus={() =>
                        setFocusedCell((prev) =>
                          prev.row === rowIndex && prev.col === colIndex ? prev : { row: rowIndex, col: colIndex },
                        )
                      }
                      style={{
                        ...(enableColumnResizing ? { width: cell.column.getSize() } : undefined),
                        ...pinnedStyle(cell.column),
                      }}
                      className={cn(
                        CELL_TEXT_CLASS[size],
                        cell.column.id === SELECT_COLUMN_ID && !enableColumnResizing && 'w-10',
                        cell.column.columnDef.meta?.width,
                        cell.column.columnDef.meta?.fillCell && 'p-0',
                        // bg-inherit picks up the row's hover/selected colour; TableRow's base
                        // bg-card keeps scrolled content from showing through when unstyled.
                        cell.column.getIsPinned() === 'left' && 'bg-inherit',
                        pinnedBorderClass(cell.column),
                        isClipped && 'overflow-hidden text-ellipsis',
                        // Cell content components (PlainTextCell, etc.) often carry their own
                        // `truncate` on an inner span — that sets whitespace/overflow directly on
                        // that span, so the outer whitespace-normal here wouldn't reach it via
                        // inheritance. Reach in and override it explicitly when wrapping.
                        isWrapped &&
                          'whitespace-normal break-words [&_.truncate]:whitespace-normal [&_.truncate]:overflow-visible [&_.truncate]:text-clip [&_.truncate]:break-words',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </TableRoot>
      <Pagination table={table} />
      {renderBulkActions && Object.values(rowSelection).some(Boolean) && (
        // Sticky to the bottom of the viewport while the table is on screen, centred over it.
        <div data-table-bulk-actions="" className="pointer-events-none sticky bottom-[var(--space-16)] z-20 flex justify-center">
          <div className="pointer-events-auto max-w-full">
            {renderBulkActions({
              selectedRows: table.getSelectedRowModel().flatRows.map((row) => row.original),
              selectedCount: table.getSelectedRowModel().flatRows.length,
              totalCount: table.getFilteredRowModel().rows.length,
              selectAll: () => table.toggleAllRowsSelected(true),
              clearSelection: () => table.resetRowSelection(),
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function selectColumn<TData>(): ColumnDef<TData, any> {
  return {
    id: SELECT_COLUMN_ID,
    enableResizing: false,
    size: SELECT_COLUMN_SIZE,
    minSize: SELECT_COLUMN_SIZE,
    maxSize: SELECT_COLUMN_SIZE,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  }
}
