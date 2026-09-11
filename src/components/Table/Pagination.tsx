import type { Table as TanStackTable } from '@tanstack/react-table'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/Button'
import { Select } from '@/components/Input/Select'

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'].map((value) => ({ value, label: value }))

export function Pagination<TData>({ table }: { table: TanStackTable<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getFilteredRowModel().rows.length
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className="flex items-center justify-between gap-[var(--space-16)] pt-[var(--space-8)]">
      <div className="flex items-center gap-[var(--space-8)]">
        <span className="text-[length:var(--text-body-4-size)] text-muted-foreground">Rows per page:</span>
        <Select
          accessibilityLabel="Rows per page"
          size="sm"
          options={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
        />
      </div>

      <div className="flex items-center gap-[var(--space-8)]">
        <span className="text-[length:var(--text-body-4-size)] text-muted-foreground">
          {from}-{to} of {total}
        </span>
        <div className="flex items-center gap-[var(--space-4)]">
          <Button
            variant="ghost"
            size="xs"
            leadingIcon={<ChevronsLeft size={14} />}
            accessibilityLabel="First page"
            isDisabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          />
          <Button
            variant="ghost"
            size="xs"
            leadingIcon={<ChevronLeft size={14} />}
            accessibilityLabel="Previous page"
            isDisabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          />
          <Button
            variant="ghost"
            size="xs"
            leadingIcon={<ChevronRight size={14} />}
            accessibilityLabel="Next page"
            isDisabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          />
          <Button
            variant="ghost"
            size="xs"
            leadingIcon={<ChevronsRight size={14} />}
            accessibilityLabel="Last page"
            isDisabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          />
        </div>
      </div>
    </div>
  )
}
