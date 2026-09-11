import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef, RowData, RowSelectionState, SortingState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { AlignLeft, MoreVertical, WrapText } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table as TableRoot, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  }
}

const SELECT_COLUMN_ID = 'select'
const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'])

export type TableSize = 'sm' | 'md'

const CELL_TEXT_CLASS: Record<TableSize, string> = {
  sm: 'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] tracking-[var(--text-body-4-letter-spacing)]',
  md: 'text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] tracking-[var(--text-body-3-letter-spacing)]',
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
  const containerRef = useRef<HTMLDivElement>(null)
  // Per-column Wrap/Clip choice, for columns with `meta: { textWrap: true }`. Absent from a
  // column's entry here means "clip" (the default) — only wrapped columns need to be tracked.
  const [wrappedColumns, setWrappedColumns] = useState<Set<string>>(new Set())

  const resolvedColumns = enableRowSelection ? [selectColumn<TData>(), ...columns] : columns

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
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
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  })

  const rows = table.getRowModel().rows
  const colCount = resolvedColumns.length

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
                  style={enableColumnResizing ? { width: header.getSize() } : undefined}
                  className={cn(
                    'relative',
                    header.column.id === SELECT_COLUMN_ID && !enableColumnResizing && 'w-10',
                    header.column.columnDef.meta?.width,
                    header.column.columnDef.meta?.headerClassName,
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
                      style={enableColumnResizing ? { width: cell.column.getSize() } : undefined}
                      className={cn(
                        CELL_TEXT_CLASS[size],
                        cell.column.id === SELECT_COLUMN_ID && !enableColumnResizing && 'w-10',
                        cell.column.columnDef.meta?.width,
                        cell.column.columnDef.meta?.fillCell && 'p-0',
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
