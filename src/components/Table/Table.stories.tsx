import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import { expect, screen, waitFor, within } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Check, MoreHorizontal, Trash2, Upload } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BulkActionBar } from '@/components/BulkActionBar'
import { FilterBar, useTableFilterState } from '@/components/Filters'
import type { FilterField, FilterOption } from '@/components/Filters'
import { createFakeLoader, createFakeResolver } from '@/components/Filters/bankTransactions.fixtures'
import { Table } from './Table'
import { columnHeader, sortableHeader, dateColumnHeader } from './columnHeader'
import { DateCell } from './cells/DateCell'
import { PlainTextCell } from './cells/PlainTextCell'
import { SubTextCell } from './cells/SubTextCell'
import { AmountCell } from './cells/AmountCell'
import { StatusCell } from './cells/StatusCell'
import { SyncStatusCell } from './cells/SyncStatusCell'
import type { SyncStatus } from './cells/SyncStatusCell'
import { ActionsCell } from './cells/ActionsCell'
import { AvatarCell } from './cells/AvatarCell'
import { LinkCell } from './cells/LinkCell'
import { ProgressBarCell } from './cells/ProgressBarCell'
import { DropdownCell } from './cells/DropdownCell'
import { InputCell } from './cells/InputCell'
import { NumberCell } from './cells/NumberCell'
import { Cell } from './cells/Cell'

// Figma: AIA - Component Library, Table
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library
// Reference: Blade's Table (https://blade.razorpay.com/?path=/docs/components-table--docs) and
// two Figma-exported cell/table reference sheets the user shared. Phase 1 only — see the plan
// for the ~13 cell types and Grouping/Nesting/Spanning modes deliberately deferred.

const meta = {
  title: 'Components/Table',
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Person = { name: string; role: string }

const PEOPLE: Person[] = [
  { name: 'Ada Lovelace', role: 'Engineer' },
  { name: 'Grace Hopper', role: 'Engineer' },
  { name: 'Alan Turing', role: 'Researcher' },
]

const basicColumns: ColumnDef<Person, any>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <PlainTextCell>{row.original.name}</PlainTextCell> },
  { accessorKey: 'role', header: 'Role', cell: ({ row }) => <PlainTextCell>{row.original.role}</PlainTextCell> },
]

export const BasicTable: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableSorting={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Ada Lovelace')).toBeVisible()
  },
}

/** Hovering tints the whole row under the pointer — every cell in it, not just the one hovered. */
export const RowHover: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableSorting={false} />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('grid')
    const row = (index: number) =>
      grid.querySelector(`td[data-row="${index}"][data-col="0"]`)?.closest('tr') as HTMLElement

    // Real CSS :hover isn't triggerable via synthetic events even in real-browser Vitest mode
    // (Chromium only updates :hover from genuine pointer input), so this checks the styling hook —
    // the tint lives on the row itself, and no individual cell carries its own hover tint.
    // The visual result is confirmed manually.
    await expect(row(0).className).toContain('hover:bg-[var(--color-table-row-hover)]')
    await expect(row(2).className).toContain('hover:bg-[var(--color-table-row-hover)]')
    const cell = grid.querySelector('td[data-row="0"][data-col="1"]') as HTMLElement
    await expect(cell.className).not.toContain('hover:bg-')
  },
}

// Figma: Karbon - AI Accountant, Table (node 24028:1090) — body cells are 12px; 'sm' steps down
// one further for tables that need to fit even more on screen.
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          sm (10px)
        </h3>
        <Table columns={basicColumns} data={PEOPLE} enableSorting={false} size="sm" />
      </section>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          md (12px, default)
        </h3>
        <Table columns={basicColumns} data={PEOPLE} enableSorting={false} size="md" />
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('gridcell')
    // Two tables of 3 rows × 2 cols each: sm's cells come first (rendered first in the DOM).
    await expect(getComputedStyle(cells[0]).fontSize).toBe('10px')
    await expect(getComputedStyle(cells[6]).fontSize).toBe('12px')
  },
}

type Voice = { type: string; account: string }

const VOICES: Voice[] = [
  { type: 'Receipt', account: 'Bank Accounts' },
  { type: 'Payment', account: 'Cash Accounts' },
]

const subTextColumns: ColumnDef<Voice, any>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <SubTextCell subText={row.original.account}>{row.original.type}</SubTextCell>,
  },
]

export const WithSubText: Story = {
  render: () => <Table columns={subTextColumns} data={VOICES} enableSorting={false} />,
}

type Voucher = { date: string; voucherNo: string; customer: string }

const VOUCHERS: Voucher[] = [
  { date: '2026-08-22', voucherNo: 'H-102', customer: 'Aster Retail Group' },
  { date: '2026-08-18', voucherNo: 'H-105', customer: 'Daisy Home Goods' },
  { date: '2026-08-20', voucherNo: 'H-103', customer: 'Bine Fashion Store' },
]

const sortableColumns: ColumnDef<Voucher, any>[] = [
  {
    accessorKey: 'date',
    header: sortableHeader('Voucher Date'),
    cell: ({ row }) => <PlainTextCell>{row.original.date}</PlainTextCell>,
  },
  {
    accessorKey: 'voucherNo',
    header: 'Voucher No.',
    cell: ({ row }) => <PlainTextCell>{row.original.voucherNo}</PlainTextCell>,
  },
  { accessorKey: 'customer', header: 'Customer', cell: ({ row }) => <PlainTextCell>{row.original.customer}</PlainTextCell> },
]

export const SortableColumns: Story = {
  render: () => <Table columns={sortableColumns} data={VOUCHERS} />,
  play: async ({ canvas, userEvent }) => {
    const rowsBefore = canvas.getAllByRole('row').slice(1) // drop header row
    await expect(rowsBefore[0]).toHaveTextContent('H-102')

    await userEvent.click(canvas.getByRole('button', { name: /Voucher Date/ }))
    await waitFor(() => {
      const rowsAfter = canvas.getAllByRole('row').slice(1)
      // ascending by ISO date string: 2026-08-18 sorts first
      expect(rowsAfter[0]).toHaveTextContent('H-105')
    })
  },
}

export const RowSelection: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableRowSelection />,
  play: async ({ canvas, userEvent }) => {
    const selectAll = canvas.getByRole('checkbox', { name: 'Select all rows' })
    await userEvent.click(selectAll)
    const rowCheckboxes = canvas.getAllByRole('checkbox', { name: 'Select row' })
    for (const checkbox of rowCheckboxes) {
      await expect(checkbox).toBeChecked()
    }

    await userEvent.click(rowCheckboxes[0])
    await waitFor(() => {
      expect(canvas.getByRole('checkbox', { name: 'Select all rows' })).toHaveAttribute('data-state', 'indeterminate')
    })
  },
}

type Invoice = { customer: string; amount: number; status: 'Paid' | 'Unpaid' | 'Partially Paid' }

const INVOICES: Invoice[] = [
  { customer: 'Aster Retail Group', amount: 19000, status: 'Unpaid' },
  { customer: 'Bine Fashion Store', amount: 15000, status: 'Partially Paid' },
  { customer: 'Crescent Electronics', amount: 15000, status: 'Paid' },
]

const STATUS_COLOR = { Paid: 'positive', Unpaid: 'negative', 'Partially Paid': 'notice' } as const

const statusColumns: ColumnDef<Invoice, any>[] = [
  { accessorKey: 'customer', header: 'Customer', cell: ({ row }) => <PlainTextCell>{row.original.customer}</PlainTextCell> },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { align: 'end' },
    cell: ({ row }) => <AmountCell amount={row.original.amount} />,
  },
  {
    accessorKey: 'status',
    header: 'Document Status',
    cell: ({ row }) => <StatusCell color={STATUS_COLOR[row.original.status]}>{row.original.status}</StatusCell>,
  },
]

export const WithStatus: Story = {
  render: () => <Table columns={statusColumns} data={INVOICES} enableSorting={false} />,
}

type SyncRow = { voucherNo: string; syncStatus: SyncStatus }

const SYNC_ROWS: SyncRow[] = [
  { voucherNo: 'H-102', syncStatus: 'not-synced' },
  { voucherNo: 'H-104', syncStatus: 'syncing' },
  { voucherNo: 'H-106', syncStatus: 'sync-failed' },
  { voucherNo: 'H-107', syncStatus: 'synced' },
]

const syncColumns: ColumnDef<SyncRow, any>[] = [
  { accessorKey: 'voucherNo', header: 'Voucher No.', cell: ({ row }) => <PlainTextCell>{row.original.voucherNo}</PlainTextCell> },
  { accessorKey: 'syncStatus', header: 'Sync Status', cell: ({ row }) => <SyncStatusCell status={row.original.syncStatus} /> },
]

export const WithSyncStatus: Story = {
  render: () => <Table columns={syncColumns} data={SYNC_ROWS} enableSorting={false} />,
}

const LARGE_DATASET: Person[] = Array.from({ length: 23 }, (_, i) => ({
  name: `Person ${i + 1}`,
  role: i % 2 === 0 ? 'Engineer' : 'Researcher',
}))

export const PaginationStory: Story = {
  name: 'Pagination',
  render: () => <Table columns={basicColumns} data={LARGE_DATASET} enableSorting={false} pageSize={5} />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Person 1')).toBeVisible()
    await expect(canvas.queryByText('Person 6')).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await waitFor(() => {
      expect(canvas.getByText('Person 6')).toBeVisible()
    })
  },
}

type SalesVoucher = {
  date: string
  voucherNo: string
  customer: string
  amount: number
  lastEditedBy: string
  lastEditedAt: string
  syncStatus: SyncStatus
}

const SALES_VOUCHERS: SalesVoucher[] = [
  { date: '22 Aug 2026', voucherNo: 'H-102', customer: 'Aster Retail Group', amount: 19000, lastEditedBy: 'Lakksith', lastEditedAt: '22 Dec 2026', syncStatus: 'not-synced' },
  { date: '20 Aug 2026', voucherNo: 'H-103', customer: 'Bine Fashion Store', amount: 15000, lastEditedBy: 'Harbhajan', lastEditedAt: '26 Dec 2026', syncStatus: 'not-synced' },
  { date: '19 Aug 2026', voucherNo: 'H-104', customer: 'Crescent Electronics', amount: 15000, lastEditedBy: 'Lakksith', lastEditedAt: '28 Dec 2026', syncStatus: 'syncing' },
  { date: '18 Aug 2026', voucherNo: 'H-105', customer: 'Daisy Home Goods', amount: 12500, lastEditedBy: 'Harbhajan', lastEditedAt: '25 Dec 2026', syncStatus: 'synced' },
  { date: '17 Aug 2026', voucherNo: 'H-106', customer: 'Eco-Friendly Products', amount: 12500, lastEditedBy: 'Lakksith', lastEditedAt: '30 Dec 2026', syncStatus: 'sync-failed' },
  { date: '16 Aug 2026', voucherNo: 'H-107', customer: 'Flora Health & Wellness', amount: 19000, lastEditedBy: 'Harbhajan', lastEditedAt: '27 Dec 2026', syncStatus: 'synced' },
]

const salesColumns: ColumnDef<SalesVoucher, any>[] = [
  {
    accessorKey: 'date',
    header: columnHeader('Voucher Date', { sortable: true, filterable: true }),
    cell: ({ row }) => <PlainTextCell>{row.original.date}</PlainTextCell>,
    size: 140,
  },
  {
    accessorKey: 'voucherNo',
    header: columnHeader('Voucher No.', { sortable: true }),
    cell: ({ row }) => <LinkCell>{row.original.voucherNo}</LinkCell>,
    size: 110,
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => <PlainTextCell editable>{row.original.customer}</PlainTextCell>,
    size: 190,
  },
  {
    accessorKey: 'amount',
    header: columnHeader('Amount', { sortable: true, filterable: true }),
    meta: { align: 'end' },
    cell: ({ row }) => <AmountCell amount={row.original.amount} />,
    size: 130,
  },
  {
    accessorKey: 'lastEditedBy',
    header: columnHeader('Created By', { sortable: true, filterable: true }),
    cell: ({ row }) => <AvatarCell name={row.original.lastEditedBy} />,
    size: 150,
  },
  {
    accessorKey: 'syncStatus',
    header: columnHeader('Sync Status', { filterable: true }),
    cell: ({ row }) => <SyncStatusCell status={row.original.syncStatus} />,
    size: 130,
  },
  {
    accessorKey: 'lastEditedAt',
    header: columnHeader('Last Updated At', { sortable: true, filterable: true }),
    cell: ({ row }) => <PlainTextCell>{row.original.lastEditedAt}</PlainTextCell>,
    size: 150,
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: { width: 'w-16', align: 'end' },
    enableResizing: false,
    size: 64,
    cell: () => (
      <ActionsCell>
        <DropdownMenu>
          {/* A native <button>, not <Button asChild>, on purpose: Button.tsx only forwards its
              own declared props (no `...rest` spread onto the DOM node), so Radix's injected
              onClick/aria-expanded/data-state from DropdownMenuTrigger's own `asChild` silently
              never reach the real element and the menu never opens. Classes below match Button's
              own ghost/xs icon-only output exactly. */}
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Row actions"
              className="inline-flex items-center justify-center border-0 rounded-[var(--radius-6)] cursor-pointer bg-transparent text-primary hover:bg-[var(--color-primary-subtle)] p-0 w-7 h-7"
            >
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Check size={14} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 size={14} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ActionsCell>
    ),
  },
]

export const ExampleSalesVouchers: Story = {
  name: 'Example: Sales Vouchers',
  render: () => (
    <Table columns={salesColumns} data={SALES_VOUCHERS} enableRowSelection enableColumnResizing />
  ),
}

// --- New Phase-1 cell types (avatar, link, progress bar, empty state, dropdown, input) ---

type BankLedger = { name: string; accountLabel: string; accountType: string | null; unreconciled: number | null }

const BANK_LEDGERS: BankLedger[] = [
  { name: 'HDFC Current Bank A/c', accountLabel: 'Bank Accounts', accountType: null, unreconciled: null },
  { name: 'ICICI Savings Bank A/c', accountLabel: 'Bank Accounts', accountType: 'Bank', unreconciled: 89 },
  { name: 'ICICI Credit Card A/c - 9876', accountLabel: 'Bank Accounts', accountType: 'Credit Card', unreconciled: 76 },
]

const ledgerColumns: ColumnDef<BankLedger, any>[] = [
  {
    accessorKey: 'name',
    header: 'Bank Ledger',
    cell: ({ row }) => (
      <SubTextCell subText={row.original.accountLabel}>
        <LinkCell>{row.original.name}</LinkCell>
      </SubTextCell>
    ),
  },
  {
    accessorKey: 'accountType',
    header: 'Account Type',
    cell: ({ row }) => <PlainTextCell empty="Not Mapped">{row.original.accountType}</PlainTextCell>,
  },
  {
    accessorKey: 'unreconciled',
    header: 'Unreconciled',
    cell: ({ row }) =>
      row.original.unreconciled ? (
        <Cell tone="negative">{row.original.unreconciled} Transactions</Cell>
      ) : (
        <Cell />
      ),
  },
]

export const WithAvatarLinkAndEmptyState: Story = {
  name: 'With Avatar, Link & Empty State',
  render: () => <Table columns={ledgerColumns} data={BANK_LEDGERS} enableSorting={false} />,
}

type ExtractionRow = { fileName: string; pendingRows: number; totalRows: number }

const EXTRACTION_ROWS: ExtractionRow[] = [
  { fileName: 'ICICI Credit Card A/c - 9876.pdf', pendingRows: 10, totalRows: 25 },
  { fileName: 'HDFC Bank LTD.pdf', pendingRows: 27, totalRows: 27 },
]

const progressColumns: ColumnDef<ExtractionRow, any>[] = [
  { accessorKey: 'fileName', header: 'File Name', cell: ({ row }) => <PlainTextCell>{row.original.fileName}</PlainTextCell> },
  {
    id: 'progress',
    header: 'Pending Rows',
    cell: ({ row }) => (
      <ProgressBarCell
        label={row.original.pendingRows}
        percent={Math.round((row.original.pendingRows / row.original.totalRows) * 100)}
      />
    ),
  },
]

export const WithProgressBar: Story = {
  render: () => <Table columns={progressColumns} data={EXTRACTION_ROWS} enableSorting={false} />,
}

export const WithStatusInfo: Story = {
  name: 'Status With Info',
  render: () => (
    <Table
      columns={[
        {
          accessorKey: 'fileName',
          header: 'File Name',
          cell: ({ row }: { row: { original: { fileName: string } } }) => <PlainTextCell>{row.original.fileName}</PlainTextCell>,
        },
        {
          id: 'status',
          header: 'Payment Status',
          cell: () => (
            <StatusCell color="negative" info="This invoice couldn't be read — try re-uploading a clearer scan.">
              Failed To Extract
            </StatusCell>
          ),
        },
      ]}
      data={[{ fileName: 'Invoice-LGQ7EDWF-0004.pdf' }]}
      enableSorting={false}
    />
  ),
}

type MappingRow = {
  date: string
  voucherNo: string
  ledger: string
  taxLedger: string
  costCentre: string
  narration: string
  amount: number
}

const MAPPING_ROWS: MappingRow[] = [
  {
    date: '22 Aug 2026',
    voucherNo: 'H-102',
    ledger: 'sales',
    taxLedger: 'output-gst',
    costCentre: 'north',
    narration: 'Sale of goods to distributor',
    amount: 19000,
  },
  {
    date: '20 Aug 2026',
    voucherNo: 'H-103',
    ledger: 'purchase',
    taxLedger: 'input-gst',
    costCentre: 'west',
    narration: 'Purchase of raw material',
    amount: 15000,
  },
  {
    date: '19 Aug 2026',
    voucherNo: 'H-104',
    ledger: 'freight',
    taxLedger: 'input-gst',
    costCentre: 'east',
    narration: 'Inter-state supply of goods',
    amount: 15000,
  },
]

const LEDGER_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'freight', label: 'Freight & Conveyance' },
]

const TAX_LEDGER_OPTIONS = [
  { value: 'output-gst', label: 'Output GST' },
  { value: 'input-gst', label: 'Input GST' },
]

const COST_CENTRE_OPTIONS = [
  { value: 'north', label: 'North Region' },
  { value: 'south', label: 'South Region' },
  { value: 'east', label: 'East Region' },
  { value: 'west', label: 'West Region' },
]

const editableColumns: ColumnDef<MappingRow, any>[] = [
  {
    accessorKey: 'date',
    header: columnHeader('Voucher Date', { sortable: true }),
    cell: ({ row }) => <PlainTextCell>{row.original.date}</PlainTextCell>,
    size: 140,
  },
  {
    accessorKey: 'voucherNo',
    header: 'Voucher No.',
    cell: ({ row }) => <LinkCell>{row.original.voucherNo}</LinkCell>,
    size: 110,
  },
  {
    accessorKey: 'ledger',
    header: 'Ledger',
    meta: { fillCell: true },
    size: 160,
    cell: ({ row }) => (
      <DropdownCell accessibilityLabel="Ledger" options={LEDGER_OPTIONS} defaultValue={row.original.ledger} />
    ),
  },
  {
    accessorKey: 'taxLedger',
    header: 'Tax Ledger',
    meta: { fillCell: true },
    size: 160,
    cell: ({ row }) => (
      <DropdownCell
        accessibilityLabel="Tax Ledger"
        options={TAX_LEDGER_OPTIONS}
        defaultValue={row.original.taxLedger}
      />
    ),
  },
  {
    accessorKey: 'costCentre',
    header: 'Cost Centre',
    meta: { fillCell: true },
    size: 160,
    cell: ({ row }) => (
      <DropdownCell
        accessibilityLabel="Cost Centre"
        options={COST_CENTRE_OPTIONS}
        defaultValue={row.original.costCentre}
      />
    ),
  },
  {
    accessorKey: 'narration',
    header: 'Narration',
    meta: { fillCell: true },
    size: 260,
    cell: ({ row }) => <InputCell accessibilityLabel="Narration" defaultValue={row.original.narration} />,
  },
  {
    accessorKey: 'amount',
    header: columnHeader('Amount', { sortable: true }),
    meta: { align: 'end' },
    cell: ({ row }) => <AmountCell amount={row.original.amount} />,
    size: 130,
  },
]

export const WithDropdownAndInput: Story = {
  render: () => <Table columns={editableColumns} data={MAPPING_ROWS} enableSorting={false} enableColumnResizing />,
}

export const KeyboardNavigation: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableSorting={false} />,
  play: async ({ canvas, userEvent }) => {
    const cells = canvas.getAllByRole('gridcell')
    // Tab into the grid — the roving-tabindex cell (row 0, col 0) is the only stop.
    await userEvent.tab()
    await expect(document.activeElement).toBe(cells[0])

    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(document.activeElement).toBe(cells[1]))

    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toBe(cells[3]))

    // Home / End: first / last column of the row. Ctrl+Home / Ctrl+End: first / last row.
    await userEvent.keyboard('{Home}')
    await waitFor(() => expect(document.activeElement).toBe(cells[2]))
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(document.activeElement).toBe(cells[3]))
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await waitFor(() => expect(document.activeElement).toBe(cells[5]))
    await userEvent.keyboard('{Control>}{Home}{/Control}')
    await waitFor(() => expect(document.activeElement).toBe(cells[1]))

    // PgDn / PgUp jump ten rows, clamped to the ends of the page.
    await userEvent.keyboard('{PageDown}')
    await waitFor(() => expect(document.activeElement).toBe(cells[5]))
    await userEvent.keyboard('{PageUp}')
    await waitFor(() => expect(document.activeElement).toBe(cells[1]))
  },
}

/** Shift+arrows select a rectangle of cells, tinted and marked `aria-selected`. Esc, a plain arrow
 *  or a click drops it. Ctrl/Cmd+C copies the range as tab-separated text (paste into a
 *  spreadsheet) — that part is the browser's own `copy` event, so it isn't asserted here. */
export const KeyboardRangeSelection: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableSorting={false} />,
  play: async ({ canvas, userEvent }) => {
    const cells = canvas.getAllByRole('gridcell')
    const selected = () => canvas.getAllByRole('gridcell').filter((cell) => cell.getAttribute('aria-selected') === 'true')

    cells[0].focus()
    await userEvent.keyboard('{Shift>}{ArrowRight}{ArrowDown}{/Shift}')
    await waitFor(() => expect(selected()).toHaveLength(4))
    await expect(selected()).toEqual([cells[0], cells[1], cells[2], cells[3]])

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(selected()).toHaveLength(0))

    // A plain arrow also drops it.
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
    await waitFor(() => expect(selected().length).toBeGreaterThan(1))
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(selected()).toHaveLength(0))
  },
}

/** The header row is part of the keyboard model: ArrowUp from the first row reaches it, Left/Right
 *  move along it, ArrowDown drops back into the grid. Enter sorts the column; Space opens its
 *  filter. */
export const KeyboardHeaders: Story = {
  render: () => <Table columns={ledgerDateColumns} data={LEDGER_ENTRIES} />,
  play: async ({ canvas, userEvent }) => {
    const cells = canvas.getAllByRole('gridcell')
    cells[0].focus()
    await userEvent.keyboard('{ArrowUp}')
    const dateHeader = canvas.getByRole('columnheader', { name: /Posted on/ })
    await waitFor(() => expect(document.activeElement).toBe(dateHeader))

    // Enter sorts: ascending puts the oldest entry (Dec 2025) first.
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(canvas.getAllByRole('gridcell')[0]).toHaveTextContent('22 Dec 2025'))

    // Space opens the column's filter.
    await userEvent.keyboard(' ')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toBeVisible())
    await userEvent.keyboard('{Escape}')

    dateHeader.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(document.activeElement).toBe(canvas.getByRole('columnheader', { name: /Narration/ })))
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(document.activeElement).toBe(canvas.getAllByRole('gridcell')[1]))
  },
}

/** Editing is a separate mode: Enter on a cell puts focus in its field, where arrows, Home/End and
 *  typing belong to the field. Enter accepts; Esc cancels and restores what was there. */
export const KeyboardEditing: Story = {
  render: () => <Table columns={editableColumns} data={MAPPING_ROWS} enableSorting={false} />,
  play: async ({ canvas, userEvent }) => {
    const narrationCell = canvas.getAllByRole('gridcell')[5] // date, voucher no., 3 dropdowns, narration
    const narration = canvas.getAllByRole('textbox', { name: 'Narration' })[0] as HTMLInputElement
    const original = narration.value

    narrationCell.focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(document.activeElement).toBe(narration))

    // Arrow keys move the caret, not the active cell.
    await userEvent.keyboard('{ArrowLeft}{End}!')
    await expect(document.activeElement).toBe(narration)
    await expect(narration.value).toBe(`${original}!`)

    // Esc cancels: value restored, focus back on the cell.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.activeElement).toBe(narrationCell))
    await expect(narration.value).toBe(original)

    // Enter accepts: value kept, focus back on the cell. (A second row, because user-event keeps its
    // own copy of a field's value that a programmatic restore like Esc's doesn't update.)
    const secondCell = canvas.getAllByRole('gridcell')[12]
    const second = canvas.getAllByRole('textbox', { name: 'Narration' })[1] as HTMLInputElement
    const secondOriginal = second.value
    secondCell.focus()
    await userEvent.keyboard('{Enter}{End}?{Enter}')
    await waitFor(() => expect(document.activeElement).toBe(secondCell))
    await expect(second.value).toBe(`${secondOriginal}?`)
  },
}

/** Space (or Enter) on a cell presses the control inside it: a checkbox toggles, a dropdown opens,
 *  a link follows. */
export const KeyboardActivatesControls: Story = {
  render: () => <Table columns={editableColumns} data={MAPPING_ROWS} enableSorting={false} enableRowSelection />,
  play: async ({ canvas, userEvent }) => {
    canvas.getAllByRole('gridcell')[0].focus()
    await userEvent.keyboard(' ')
    await waitFor(() => expect(canvas.getAllByRole('checkbox', { name: 'Select row' })[0]).toBeChecked())

    // The Ledger dropdown is the fourth cell in the row (checkbox, date, voucher no., ledger).
    canvas.getAllByRole('gridcell')[3].focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByPlaceholderText('Search…')).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument())

    // Inside the open panel: ArrowDown highlights the next option, Enter picks it and closes the
    // panel, and focus lands back in the cell so the grid keys work again.
    canvas.getAllByRole('gridcell')[3].focus()
    await userEvent.keyboard('{Enter}{ArrowDown}{Enter}')
    await waitFor(() => expect(canvas.getAllByRole('combobox', { name: 'Ledger' })[0]).toHaveTextContent('Purchase'))
    await expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}')
    // One row down from the Ledger cell (3 columns in, 8 cells per row): checkbox + 7 columns.
    await waitFor(() => expect(document.activeElement).toBe(canvas.getAllByRole('gridcell')[11]))
  },
}

const KEYBOARD_SHORTCUTS: Array<{ action: string; keys: string[][] }> = [
  { action: 'Move between cells', keys: [['↑'], ['↓'], ['←'], ['→']] },
  { action: 'Select a range of cells', keys: [['Shift', '↑ ↓ ← →']] },
  { action: 'Copy the selected range', keys: [['Ctrl / Cmd', 'C']] },
  { action: 'First / last column', keys: [['Home'], ['End']] },
  { action: 'First / last row', keys: [['Ctrl', 'Home'], ['Ctrl', 'End']] },
  { action: 'Jump 10 rows', keys: [['PgUp'], ['PgDn']] },
  { action: 'Reach the column headers', keys: [['↑ from the first row']] },
  { action: 'Sort / filter a column (on a header)', keys: [['Enter'], ['Space']] },
  { action: 'Edit a cell / press its control', keys: [['Enter'], ['Space']] },
  { action: 'Accept an edit', keys: [['Enter']] },
  { action: 'Cancel an edit, or drop a range', keys: [['Esc']] },
]

/** Reference for the keyboard model — see `useGridKeyboard.ts`. Shortcuts stand down while typing
 *  in a text field, except Enter (accept) and Esc (cancel). */
export const KeyboardShortcuts: Story = {
  render: () => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxWidth: 520, fontFamily: 'var(--font-family-primary)' }}>
      {KEYBOARD_SHORTCUTS.map((shortcut) => (
        <li
          key={shortcut.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '12px 0',
            borderBottom: '1px solid var(--color-table-border)',
            color: 'var(--color-text)',
          }}
        >
          <span>{shortcut.action}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {shortcut.keys.map((combo, comboIndex) => (
              <span key={combo.join('+')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {comboIndex > 0 && <span style={{ color: 'var(--color-text-secondary)' }}>/</span>}
                {combo.map((key, keyIndex) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {keyIndex > 0 && <span style={{ color: 'var(--color-text-secondary)' }}>+</span>}
                    <kbd
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--color-bg-subtle)',
                        color: 'var(--color-text-secondary)',
                        font: 'inherit',
                      }}
                    >
                      {key}
                    </kbd>
                  </span>
                ))}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  ),
}

export const ColumnResizing: Story = {
  render: () => (
    <Table columns={basicColumns} data={PEOPLE} enableSorting={false} enableRowSelection enableColumnResizing />
  ),
  play: async ({ canvas, userEvent }) => {
    const headers = canvas.getAllByRole('columnheader')
    const [selectHeader, nameHeader] = headers
    const selectWidthBefore = selectHeader.getBoundingClientRect().width
    const nameWidthBefore = nameHeader.getBoundingClientRect().width

    const handle = within(nameHeader).getByRole('separator')
    const handleBox = handle.getBoundingClientRect()
    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { x: handleBox.x + 2, y: handleBox.y + 2 } },
      { coords: { x: handleBox.x + 82, y: handleBox.y + 2 } },
      { keys: '[/MouseLeft]' },
    ])

    await waitFor(() => {
      expect(nameHeader.getBoundingClientRect().width).toBeGreaterThan(nameWidthBefore + 50)
    })
    // The checkbox column has `enableResizing: false` — it must never move.
    await expect(selectHeader.getBoundingClientRect().width).toBe(selectWidthBefore)
  },
}

type DescriptionRow = { description: string; voucherNo: string }

const DESCRIPTION_ROWS: DescriptionRow[] = [
  { description: 'MPS/P2A/934820165741/BHARAT SALES CORPORATION - inter-state supply', voucherNo: 'BV-2026-0741' },
  { description: 'MPS/P2A/934820165742/BHARAT SALES CORPORATION - inter-state supply', voucherNo: 'BV-2026-0742' },
  { description: 'MPS/P2A/934820165743/BHARAT SALES CORPORATION - inter-state supply', voucherNo: 'BV-2026-0743' },
]

const textWrapColumns: ColumnDef<DescriptionRow, any>[] = [
  {
    accessorKey: 'description',
    header: 'Description',
    meta: { textWrap: true },
    size: 220,
    cell: ({ row }) => <PlainTextCell>{row.original.description}</PlainTextCell>,
  },
  {
    accessorKey: 'voucherNo',
    header: 'Voucher No.',
    size: 140,
    cell: ({ row }) => <PlainTextCell>{row.original.voucherNo}</PlainTextCell>,
  },
]

export const TextWrap: Story = {
  render: () => (
    <Table columns={textWrapColumns} data={DESCRIPTION_ROWS} enableSorting={false} enableColumnResizing />
  ),
  play: async ({ canvas, userEvent }) => {
    const cell = canvas.getAllByRole('gridcell')[0]
    const heightBefore = cell.getBoundingClientRect().height

    // The menu content portals outside the story root (like a Tooltip/Dialog would), so it must
    // be queried via `screen` (whole document), not `canvas` (scoped to the story root) — the
    // trigger button itself isn't portalled, so that one is still a `canvas` query.
    await userEvent.click(canvas.getByRole('button', { name: 'description column options' }))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Wrap Text/ }))

    await waitFor(() => {
      expect(cell.getBoundingClientRect().height).toBeGreaterThan(heightBefore)
    })

    // Switching back to Clip Text returns it to a single line.
    await userEvent.click(canvas.getByRole('button', { name: 'description column options' }))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Clip Text/ }))
    await waitFor(() => {
      expect(cell.getBoundingClientRect().height).toBe(heightBefore)
    })
  },
}

// --- Column customization -------------------------------------------------------------------
// `meta.title` gives each column a readable name in the panel (`header` is a render function, so
// there's no string to read off it), and `meta.lockColumn` exempts the two structural columns.

type ChargebackRow = {
  date: string
  description: string
  ledger: string
  type: string
  amount: number
  gst: string
  costCentre: string
  reviewed: string
}

const CHARGEBACK_ROWS: ChargebackRow[] = [
  { date: '12 Aug 2025', description: 'UPI settlement reversal', ledger: 'HDFC Bank', type: 'Debit', amount: -12400, gst: '27AAACH1234K', costCentre: 'Ops', reviewed: 'Yes' },
  { date: '14 Aug 2025', description: 'Merchant chargeback — order #88412', ledger: 'ICICI Bank', type: 'Debit', amount: -3250, gst: '29AABCI5678L', costCentre: 'Support', reviewed: 'No' },
  { date: '19 Aug 2025', description: 'Chargeback recovery credit', ledger: 'Axis Bank', type: 'Credit', amount: 3250, gst: '07AAACA9012M', costCentre: 'Support', reviewed: 'Yes' },
  { date: '23 Aug 2025', description: 'Card network dispute fee', ledger: 'Kotak Mahindra', type: 'Debit', amount: -900, gst: '24AAACK3456N', costCentre: 'Finance', reviewed: 'No' },
]

const chargebackColumns: ColumnDef<ChargebackRow, any>[] = [
  { accessorKey: 'date', header: columnHeader<ChargebackRow>('Date'), meta: { title: 'Date', lockColumn: true }, cell: ({ row }) => <PlainTextCell>{row.original.date}</PlainTextCell> },
  { accessorKey: 'description', header: columnHeader<ChargebackRow>('Description'), meta: { title: 'Description' }, cell: ({ row }) => <PlainTextCell>{row.original.description}</PlainTextCell> },
  { accessorKey: 'ledger', header: columnHeader<ChargebackRow>('Ledger'), meta: { title: 'Ledger' }, cell: ({ row }) => <PlainTextCell>{row.original.ledger}</PlainTextCell> },
  { accessorKey: 'type', header: columnHeader<ChargebackRow>('Type'), meta: { title: 'Type' }, cell: ({ row }) => <PlainTextCell>{row.original.type}</PlainTextCell> },
  { accessorKey: 'amount', header: sortableHeader<ChargebackRow>('Amount'), meta: { title: 'Amount', align: 'end' }, cell: ({ row }) => <AmountCell amount={row.original.amount} variant={row.original.amount < 0 ? 'debit' : 'credit'} /> },
  { accessorKey: 'gst', header: columnHeader<ChargebackRow>('GST Registration'), meta: { title: 'GST Registration' }, cell: ({ row }) => <PlainTextCell>{row.original.gst}</PlainTextCell> },
  { accessorKey: 'costCentre', header: columnHeader<ChargebackRow>('Cost Centre'), meta: { title: 'Cost Centre' }, cell: ({ row }) => <PlainTextCell>{row.original.costCentre}</PlainTextCell> },
  { accessorKey: 'reviewed', header: columnHeader<ChargebackRow>('Reviewed'), meta: { title: 'Reviewed', lockColumn: true }, cell: ({ row }) => <PlainTextCell>{row.original.reviewed}</PlainTextCell> },
]

export const ColumnCustomization: Story = {
  render: () => (
    <Table
      columns={chargebackColumns}
      data={CHARGEBACK_ROWS}
      enableSorting={false}
      enableRowSelection
      enableColumnResizing
      enableColumnCustomization
    />
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('columnheader', { name: /Ledger/ })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Customize columns' }))
    // The panel portals out of the story root, so it's queried via `screen`.
    const panel = await screen.findByRole('list')
    await userEvent.click(await within(panel).findByText('Ledger'))

    // Hiding a column removes its header and every matching body cell from the real grid.
    await waitFor(() => {
      expect(canvas.queryByRole('columnheader', { name: /Ledger/ })).not.toBeInTheDocument()
    })
    await expect(canvas.queryByText('HDFC Bank')).not.toBeInTheDocument()
  },
}

/** Pinning freezes the column against the left edge of the horizontal scroll container. */
export const ColumnPinning: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Table
        columns={chargebackColumns}
        data={CHARGEBACK_ROWS}
        enableSorting={false}
        enableColumnResizing
        enableColumnCustomization
      />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Customize columns' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Pin Description' }))

    await waitFor(() => {
      const header = canvas.getByRole('columnheader', { name: /Description/ })
      expect(getComputedStyle(header).position).toBe('sticky')
    })
  },
}

// --- Date column: real filtering, and correct chronological sorting -------------------------
// Values are real `Date`s rendered through `DateCell`, not pre-formatted strings. That's what
// makes `sortingFn: 'datetime'` and the date-range filter work. Storing '22 Dec 2025' as a string
// sorts alphabetically, which puts '9 Jan 2026' *before* it — the bug this replaces.

type LedgerEntry = { postedOn: Date; narration: string; amount: number }

// Pinned, not `new Date()`: the panel's presets and default month are reckoned from "today", so a
// clock-derived value would make these assertions fail once the month rolls over.
const LEDGER_TODAY = new Date(2026, 8, 15) // 15 Sep 2026

const LEDGER_ENTRIES: LedgerEntry[] = [
  { postedOn: new Date(2025, 11, 22), narration: 'Year-end accrual', amount: -18200 },
  { postedOn: new Date(2026, 0, 9), narration: 'Opening balance transfer', amount: 45000 },
  { postedOn: new Date(2026, 7, 12), narration: 'UPI settlement reversal', amount: -12400 },
  { postedOn: new Date(2026, 8, 3), narration: 'Merchant chargeback', amount: -3250 },
  { postedOn: new Date(2026, 8, 14), narration: 'Chargeback recovery', amount: 3250 },
]

const ledgerDateColumns: ColumnDef<LedgerEntry, any>[] = [
  {
    accessorKey: 'postedOn',
    header: dateColumnHeader<LedgerEntry>('Posted on', { today: LEDGER_TODAY }),
    sortingFn: 'datetime',
    filterFn: 'dateRange',
    meta: { title: 'Posted on', filterType: 'date' },
    cell: ({ row }) => <DateCell value={row.original.postedOn} />,
  },
  {
    accessorKey: 'narration',
    header: columnHeader<LedgerEntry>('Narration'),
    meta: { title: 'Narration' },
    cell: ({ row }) => <PlainTextCell>{row.original.narration}</PlainTextCell>,
  },
  {
    accessorKey: 'amount',
    header: sortableHeader<LedgerEntry>('Amount'),
    meta: { title: 'Amount', align: 'end' },
    cell: ({ row }) => (
      <AmountCell amount={row.original.amount} variant={row.original.amount < 0 ? 'debit' : 'credit'} />
    ),
  },
]

/** The Filter icon in the "Posted on" header is no longer a placeholder — it opens a range
 *  calendar that actually removes rows. */
export const DateColumnFilter: Story = {
  render: () => <Table columns={ledgerDateColumns} data={LEDGER_ENTRIES} />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('row')).toHaveLength(6) // header + 5

    await userEvent.click(canvas.getByRole('button', { name: 'Filter Posted on' }))
    // Pick a range covering only the two September 2026 entries.
    await userEvent.click(await screen.findByRole('button', { name: /September 1st, 2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: /September 30th, 2026/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => {
      expect(canvas.getAllByRole('row')).toHaveLength(3) // header + 2
    })
    await expect(canvas.getByText('Merchant chargeback')).toBeVisible()
    await expect(canvas.queryByText('Year-end accrual')).not.toBeInTheDocument()
  },
}

/** Clearing the filter restores every row. */
export const DateColumnFilterClears: Story = {
  render: () => <Table columns={ledgerDateColumns} data={LEDGER_ENTRIES} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Posted on' }))
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Date range' }), 'Last 30 days')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(canvas.queryByText('Year-end accrual')).not.toBeInTheDocument())

    // Apply closed the panel, so reopen it: Reset clears the draft, and Apply commits that.
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Posted on' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Reset' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(canvas.getAllByRole('row')).toHaveLength(6))
  },
}

/** The sorting fix: dates order chronologically, so Dec 2025 precedes Jan 2026. Held as display
 *  strings, an alphabetical sort would have put '9 Jan 2026' before '22 Dec 2025'. */
export const DatesSortChronologically: Story = {
  render: () => <Table columns={ledgerDateColumns} data={LEDGER_ENTRIES} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Posted on' }))

    await waitFor(() => {
      const cells = canvas.getAllByRole('gridcell').filter((c) => /\d{4}$/.test(c.textContent ?? ''))
      expect(cells[0]).toHaveTextContent('22 Dec 2025')
      expect(cells[1]).toHaveTextContent('9 Jan 2026')
    })
  },
}

// --- Cell properties: alignment and empty-value handling --------------------------------------

type IndexedAmount = { index: number; amount: number }

const INDEXED_AMOUNTS: IndexedAmount[] = [
  { index: 1, amount: 4500 },
  { index: 2, amount: 12000 },
]

const alignmentColumns: ColumnDef<IndexedAmount, any>[] = [
  {
    accessorKey: 'index',
    header: 'Si No.',
    meta: { align: 'center', width: 'w-16' },
    cell: ({ row }) => <PlainTextCell align="center">{row.original.index}</PlainTextCell>,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { align: 'end' },
    cell: ({ row }) => <AmountCell amount={row.original.amount} />,
  },
]

/** A column's `meta.align` aligns its header and every body cell together — Figma: "Si No." is
 *  centred and Amount/Credit/Debit are right-aligned (node 24028:1090). `AmountCell` itself
 *  defaults its own `align` to `'end'`, but the header only follows suit once the column also
 *  declares `meta.align` — this story is the regression test for that agreement. */
export const ColumnAlignment: Story = {
  render: () => <Table columns={alignmentColumns} data={INDEXED_AMOUNTS} enableSorting={false} />,
  play: async ({ canvas }) => {
    const headers = canvas.getAllByRole('columnheader')
    const cells = canvas.getAllByRole('gridcell')

    await expect(getComputedStyle(headers[0]).textAlign).toBe('center')
    await expect(getComputedStyle(cells[0]).textAlign).toBe('center')

    // `text-align: end` resolves to a physical keyword ('right' in this LTR story) in some
    // browsers and stays 'end' in others — accept either rather than pin one.
    await expect(getComputedStyle(headers[1]).textAlign).toMatch(/right|end/)
    await expect(getComputedStyle(cells[1]).textAlign).toMatch(/right|end/)
  },
}

const EMPTY_VALUE_ROWS: Array<{ id: number }> = [{ id: 1 }]

const emptyValueColumns: ColumnDef<{ id: number }, any>[] = [
  { id: 'plain', header: 'Plain', cell: () => <PlainTextCell>{null}</PlainTextCell> },
  { id: 'subtext', header: 'Sub text', cell: () => <SubTextCell subText={null}>{null}</SubTextCell> },
  { id: 'amount', header: 'Amount', cell: () => <AmountCell amount={null} /> },
  { id: 'status', header: 'Status', cell: () => <StatusCell>{null}</StatusCell> },
  { id: 'avatar', header: 'Avatar', cell: () => <AvatarCell name={null} /> },
  { id: 'link', header: 'Link', cell: () => <LinkCell>{null}</LinkCell> },
  { id: 'progress', header: 'Progress', cell: () => <ProgressBarCell percent={null} /> },
  { id: 'sync', header: 'Sync', cell: () => <SyncStatusCell status={null} /> },
  { id: 'date', header: 'Date', cell: () => <DateCell value={null} /> },
]

/** Nullish row data must never crash a cell — `AmountCell`/`AvatarCell` used to (`.toFixed`/
 *  `.trim` on `null`) — and reads as a muted em dash everywhere, so an empty value is never
 *  silently a blank cell indistinguishable from a loading or broken one. */
export const EmptyValues: Story = {
  render: () => <Table columns={emptyValueColumns} data={EMPTY_VALUE_ROWS} enableSorting={false} />,
  play: async ({ canvas }) => {
    const cells = canvas.getAllByRole('gridcell')
    await expect(cells).toHaveLength(9)
    for (const cell of cells) {
      await expect(cell).toHaveTextContent('—')
    }
  },
}

// --- Active cell, disabled cells, action-icon counts, tooltips, and a plain number cell -------

/** The "active" cell is the keyboard-focused one: tab into the grid and it gets the system's
 *  global focus ring (tokens.css's `:focus-visible` rule), exactly like every other focusable
 *  element — nothing table-specific to opt into. Arrow-key movement between cells is covered by
 *  `KeyboardNavigation`; this story is the minimal, discoverable demo of the ring itself. */
export const ActiveCell: Story = {
  render: () => <Table columns={basicColumns} data={PEOPLE} enableSorting={false} />,
  play: async ({ canvas, userEvent }) => {
    const cells = canvas.getAllByRole('gridcell')
    await userEvent.tab()
    await expect(document.activeElement).toBe(cells[0])
    // The ring is a 1px border + shadow on the grid lines (tokens.css), not an `outline`.
    await expect(getComputedStyle(cells[0]).borderBottomWidth).toBe('1px')
    await expect(getComputedStyle(cells[0]).boxShadow).not.toBe('none')
  },
}

type DisableableRow = { name: string; ledger: string }

const DISABLE_ROWS: DisableableRow[] = [
  { name: 'Ada Lovelace', ledger: 'sales' },
  { name: 'Grace Hopper', ledger: 'purchase' },
]

const disabledColumns: ColumnDef<DisableableRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <PlainTextCell editable isDisabled={row.index === 0}>
        {row.original.name}
      </PlainTextCell>
    ),
  },
  {
    accessorKey: 'ledger',
    header: 'Ledger',
    meta: { fillCell: true },
    cell: ({ row }) => (
      <DropdownCell
        accessibilityLabel="Ledger"
        options={LEDGER_OPTIONS}
        defaultValue={row.original.ledger}
        isDisabled={row.index === 0}
      />
    ),
  },
  {
    id: 'link',
    header: 'Link',
    cell: ({ row }) => (
      <LinkCell href="#" isDisabled={row.index === 0}>
        Open
      </LinkCell>
    ),
  },
]

/** `isDisabled` is per-cell (a row's own data decides it), not a column-wide switch — the first
 *  row here is locked, the second isn't. Dropdown/Input get the real `disabled` attribute, not
 *  just a dimmed look; a disabled link drops its `href` (matches Button.tsx's own treatment) so
 *  it's out of the tab order rather than merely unclickable. */
export const DisabledCells: Story = {
  render: () => <Table columns={disabledColumns} data={DISABLE_ROWS} enableSorting={false} />,
  play: async ({ canvas }) => {
    const ledgerSelects = canvas.getAllByRole('combobox', { name: 'Ledger' })
    await expect(ledgerSelects[0]).toBeDisabled()
    await expect(ledgerSelects[1]).not.toBeDisabled()

    const links = canvas.getAllByText('Open')
    await expect(links[0]).toHaveAttribute('aria-disabled', 'true')
    await expect(links[0]).not.toHaveAttribute('href')
    await expect(links[1]).toHaveAttribute('href', '#')
  },
}

// Figma: AIA - Component Library, Actions Column (node 603:2177) — one column holds either a
// single icon button (a "⋮" menu) or two side by side (an upload icon + "⋮"). ActionsCell already
// takes any number of buttons as children; "single"/"dual" is just how many you put in it.

const iconButtonClasses =
  'inline-flex items-center justify-center border-0 rounded-[var(--radius-6)] cursor-pointer bg-transparent text-muted-foreground hover:bg-[var(--color-bg-subtle)] hover:text-foreground p-0 w-7 h-7'

const singleIconColumns: ColumnDef<Person, any>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <PlainTextCell>{row.original.name}</PlainTextCell> },
  {
    id: 'actions',
    header: 'Actions',
    meta: { width: 'w-16', align: 'end' },
    cell: () => (
      <ActionsCell>
        <button type="button" className={iconButtonClasses} aria-label="Row actions">
          <MoreHorizontal size={14} />
        </button>
      </ActionsCell>
    ),
  },
]

const dualIconColumns: ColumnDef<Person, any>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <PlainTextCell>{row.original.name}</PlainTextCell> },
  {
    id: 'actions',
    header: 'Actions',
    meta: { width: 'w-20', align: 'end' },
    cell: () => (
      <ActionsCell>
        <button type="button" className={iconButtonClasses} aria-label="Upload">
          <Upload size={14} />
        </button>
        <button type="button" className={iconButtonClasses} aria-label="Row actions">
          <MoreHorizontal size={14} />
        </button>
      </ActionsCell>
    ),
  },
]

export const ActionIcons: Story = {
  name: 'Action Icons (Single & Dual)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          Single icon
        </h3>
        <Table columns={singleIconColumns} data={PEOPLE} enableSorting={false} />
      </section>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          Dual icon
        </h3>
        <Table columns={dualIconColumns} data={PEOPLE} enableSorting={false} />
      </section>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('button', { name: 'Row actions' }).length).toBeGreaterThan(0)
    await expect(canvas.getAllByRole('button', { name: 'Upload' }).length).toBeGreaterThan(0)
  },
}

/** The same native-tooltip mechanism `StatusCell.info` already used, generalized to every cell
 *  via the shared `tooltip` prop. */
export const WithTooltip: Story = {
  render: () => (
    <Table
      columns={[
        {
          accessorKey: 'name',
          header: 'Customer',
          cell: ({ row }: { row: { original: { name: string } } }) => (
            <PlainTextCell tooltip={`Full legal name: ${row.original.name}`}>{row.original.name}</PlainTextCell>
          ),
        },
      ]}
      data={[{ name: 'Aster Retail Group Pvt. Ltd.' }]}
      enableSorting={false}
    />
  ),
  play: async ({ canvas }) => {
    const cell = canvas.getByText('Aster Retail Group Pvt. Ltd.').closest('[title]') as HTMLElement
    await expect(cell).toHaveAttribute('title', 'Full legal name: Aster Retail Group Pvt. Ltd.')
  },
}

type QuantityRow = { item: string; quantity: number | null; completion: number }

const QUANTITY_ROWS: QuantityRow[] = [
  { item: 'Invoice batch A', quantity: 128, completion: 100 },
  { item: 'Invoice batch B', quantity: 42, completion: 67.5 },
  { item: 'Invoice batch C', quantity: null, completion: 0 },
]

const numberColumns: ColumnDef<QuantityRow, any>[] = [
  { accessorKey: 'item', header: 'Item', cell: ({ row }) => <PlainTextCell>{row.original.item}</PlainTextCell> },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    meta: { align: 'end' },
    cell: ({ row }) => <NumberCell value={row.original.quantity} />,
  },
  {
    accessorKey: 'completion',
    header: 'Completion',
    meta: { align: 'end' },
    cell: ({ row }) => <NumberCell value={row.original.completion} decimals={1} suffix="%" />,
  },
]

/** A plain numeric cell — right-aligned, tabular figures, but none of `AmountCell`'s ₹ symbol or
 *  Cr/Dr suffix. For quantities, counts and percentages. */
export const WithNumberCell: Story = {
  render: () => <Table columns={numberColumns} data={QUANTITY_ROWS} enableSorting={false} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('128')).toBeVisible()
    await expect(canvas.getByText('67.5')).toBeVisible()
    await expect(canvas.queryByText(/₹/)).not.toBeInTheDocument()
  },
}

// --- Example: every feature working together --------------------------------------------------
// One realistic table with the lot: toolbar filters (quick chips + All filters + a date filter in
// the column header, all driving the same state), sorting, column resize / show-hide / reorder /
// pin, row selection with a bulk action bar, inline-editable cells, every cell type, empty values,
// disabled cells, tooltips, wrapped text, row actions, pagination and an empty state. Placeholder
// data throughout — the shape matters here, not the words.

type OrderStatus = 'delivered' | 'processing' | 'pending' | 'cancelled' | 'failed'

type Order = {
  id: string
  orderedOn: Date
  orderNo: string
  customer: string
  owner: string
  category: string
  description: string
  notes: string
  status: OrderStatus
  fulfilled: number | null
  quantity: number | null
  amount: number
  sync: SyncStatus | null
}

// Pinned, not `new Date()`: date presets are reckoned from "today", so a clock-derived value would
// make the story's assertions drift as the calendar moves. Tuesday 15 Sep 2026.
const ORDERS_TODAY = new Date(2026, 8, 15)

const ORDER_CUSTOMERS: FilterOption[] = [
  { value: 'c_acme', label: 'Acme Corp' },
  { value: 'c_globex', label: 'Globex' },
  { value: 'c_initech', label: 'Initech' },
  { value: 'c_umbrella', label: 'Umbrella Ltd' },
  { value: 'c_hooli', label: 'Hooli' },
  { value: 'c_stark', label: 'Stark Supply' },
]

const ORDER_REGIONS: Record<string, string> = {
  c_acme: 'North region',
  c_globex: 'East region',
  c_initech: 'West region',
  c_umbrella: 'South region',
  c_hooli: 'North region',
  c_stark: 'East region',
}

const ORDER_OWNERS: FilterOption[] = [
  { value: 'o_jane', label: 'Jane Doe' },
  { value: 'o_john', label: 'John Roe' },
  { value: 'o_sam', label: 'Sam Lee' },
  { value: 'o_alex', label: 'Alex Kim' },
]

const ORDER_CATEGORIES: FilterOption[] = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'services', label: 'Services' },
]

const ORDER_STATUS_OPTIONS: Array<FilterOption & { value: OrderStatus }> = [
  { value: 'delivered', label: 'Delivered', color: 'positive' },
  { value: 'processing', label: 'Processing', color: 'information' },
  { value: 'pending', label: 'Pending', color: 'notice' },
  { value: 'cancelled', label: 'Cancelled', color: 'neutral' },
  { value: 'failed', label: 'Failed', color: 'negative' },
]

const ORDER_FIELDS: FilterField[] = [
  {
    key: 'customer',
    label: 'Customer',
    type: 'entity_ref',
    quickFilter: true,
    loadOptions: createFakeLoader(ORDER_CUSTOMERS),
    resolveOptions: createFakeResolver(ORDER_CUSTOMERS),
  },
  { key: 'status', label: 'Status', type: 'enum', quickFilter: true, options: ORDER_STATUS_OPTIONS },
  { key: 'owner', label: 'Owner', type: 'enum', options: ORDER_OWNERS },
  { key: 'orderedOn', label: 'Date', type: 'date', maxDate: ORDERS_TODAY },
]

const STATUS_CYCLE: OrderStatus[] = ['delivered', 'processing', 'pending', 'delivered', 'cancelled', 'processing', 'failed', 'delivered']
const SYNC_CYCLE: SyncStatus[] = ['synced', 'syncing', 'not-synced', 'sync-failed']
const DESCRIPTIONS = [
  'Quarterly restock of workstation peripherals, shipped in two consignments to the main warehouse',
  'Annual licence renewal covering all seats, invoiced against the master agreement',
  'On-site installation and configuration support, including a follow-up training session',
]

const ORDERS: Order[] = Array.from({ length: 26 }, (_, i) => {
  const status = STATUS_CYCLE[i % STATUS_CYCLE.length]
  return {
    id: `ord_${i + 1}`,
    orderedOn: new Date(2026, 8, 15 - i * 6),
    orderNo: `ORD-${1001 + i}`,
    customer: ORDER_CUSTOMERS[i % ORDER_CUSTOMERS.length].value,
    owner: ORDER_OWNERS[i % ORDER_OWNERS.length].value,
    category: ORDER_CATEGORIES[i % ORDER_CATEGORIES.length].value,
    description: DESCRIPTIONS[i % DESCRIPTIONS.length],
    notes: i % 4 === 1 ? '' : 'Confirm delivery window',
    status,
    // Each cell type gets a null somewhere, so the empty-value treatment shows up in context.
    fulfilled: status === 'cancelled' ? null : status === 'delivered' ? 100 : status === 'pending' ? 0 : 20 + ((i * 13) % 60),
    quantity: i % 7 === 3 ? null : 5 + ((i * 11) % 40),
    amount: 1200 + Math.round(((i * 7919) % 18000) / 50) * 50,
    sync: status === 'cancelled' ? null : SYNC_CYCLE[i % SYNC_CYCLE.length],
  }
})

const ORDERS_PAGE_SIZE = 10

function OrdersExample() {
  const [orders, setOrders] = useState(ORDERS)
  const filters = useTableFilterState(ORDER_FIELDS)

  const patchOrder = (id: string, patch: Partial<Order>) =>
    setOrders((previous) => previous.map((order) => (order.id === id ? { ...order, ...patch } : order)))

  // `setOrders` is stable, so the column defs are built once; each cell reads its row's own data.
  const columns = useMemo<ColumnDef<Order, any>[]>(
    () => [
      {
        accessorKey: 'orderedOn',
        header: dateColumnHeader<Order>('Order date', { today: ORDERS_TODAY }),
        sortingFn: 'datetime',
        filterFn: 'dateRange',
        meta: { title: 'Order date', filterType: 'date', lockColumn: true },
        size: 150,
        cell: ({ row }) => <DateCell value={row.original.orderedOn} />,
      },
      {
        accessorKey: 'orderNo',
        header: columnHeader<Order>('Order no.', { sortable: true }),
        meta: { title: 'Order no.' },
        size: 120,
        cell: ({ row }) => (
          <LinkCell
            isDisabled={row.original.status === 'cancelled'}
            tooltip={row.original.status === 'cancelled' ? "Cancelled orders can't be opened" : undefined}
          >
            {row.original.orderNo}
          </LinkCell>
        ),
      },
      {
        accessorKey: 'customer',
        header: columnHeader<Order>('Customer', { sortable: true }),
        filterFn: 'anyOf',
        meta: { title: 'Customer' },
        size: 190,
        cell: ({ row }) => (
          <SubTextCell subText={ORDER_REGIONS[row.original.customer]}>
            {ORDER_CUSTOMERS.find((option) => option.value === row.original.customer)?.label}
          </SubTextCell>
        ),
      },
      {
        accessorKey: 'owner',
        header: columnHeader<Order>('Owner', { sortable: true }),
        filterFn: 'anyOf',
        meta: { title: 'Owner' },
        size: 150,
        cell: ({ row }) => <AvatarCell name={ORDER_OWNERS.find((option) => option.value === row.original.owner)?.label} />,
      },
      {
        accessorKey: 'category',
        header: columnHeader<Order>('Category'),
        meta: { title: 'Category', fillCell: true },
        size: 150,
        cell: ({ row }) => (
          <DropdownCell
            accessibilityLabel="Category"
            options={ORDER_CATEGORIES}
            value={row.original.category}
            onChange={(category) => patchOrder(row.original.id, { category })}
            isDisabled={row.original.status === 'cancelled'}
          />
        ),
      },
      {
        accessorKey: 'description',
        header: columnHeader<Order>('Description'),
        // The header's "⋮" menu switches this column between clipped and wrapped text.
        meta: { title: 'Description', textWrap: true },
        size: 240,
        cell: ({ row }) => <PlainTextCell>{row.original.description}</PlainTextCell>,
      },
      {
        accessorKey: 'notes',
        header: columnHeader<Order>('Notes'),
        meta: { title: 'Notes', fillCell: true },
        size: 200,
        cell: ({ row }) => (
          <InputCell
            accessibilityLabel="Notes"
            placeholder="Add a note"
            value={row.original.notes}
            onChange={(event) => patchOrder(row.original.id, { notes: event.target.value })}
            isDisabled={row.original.status === 'cancelled'}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: columnHeader<Order>('Status'),
        filterFn: 'anyOf',
        meta: { title: 'Status' },
        size: 140,
        cell: ({ row }) => {
          const option = ORDER_STATUS_OPTIONS.find((candidate) => candidate.value === row.original.status)
          return (
            <StatusCell
              color={option?.color}
              info={row.original.status === 'failed' ? "This order couldn't be processed — retry from the row menu." : undefined}
            >
              {option?.label}
            </StatusCell>
          )
        },
      },
      {
        accessorKey: 'fulfilled',
        header: columnHeader<Order>('Fulfilled'),
        meta: { title: 'Fulfilled' },
        size: 160,
        cell: ({ row }) => (
          <ProgressBarCell
            label={row.original.quantity == null ? null : `${row.original.quantity} units`}
            percent={row.original.fulfilled}
          />
        ),
      },
      {
        accessorKey: 'quantity',
        header: columnHeader<Order>('Quantity', { sortable: true }),
        meta: { title: 'Quantity', align: 'end' },
        size: 120,
        cell: ({ row }) => <NumberCell value={row.original.quantity} />,
      },
      {
        accessorKey: 'amount',
        header: columnHeader<Order>('Amount', { sortable: true }),
        meta: { title: 'Amount', align: 'end' },
        size: 140,
        cell: ({ row }) => <AmountCell amount={row.original.amount} />,
      },
      {
        accessorKey: 'sync',
        header: columnHeader<Order>('Sync status'),
        meta: { title: 'Sync status' },
        size: 140,
        cell: ({ row }) => <SyncStatusCell status={row.original.sync} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { title: 'Actions', width: 'w-20', align: 'end', lockColumn: true },
        enableResizing: false,
        size: 80,
        cell: ({ row }) => (
          <ActionsCell>
            <button type="button" className={iconButtonClasses} aria-label="Upload attachment">
              <Upload size={14} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={iconButtonClasses} aria-label="Row actions">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Check size={14} />
                  Mark as reviewed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setOrders((previous) => previous.filter((order) => order.id !== row.original.id))}
                >
                  <Trash2 size={14} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ActionsCell>
        ),
      },
    ],
    [],
  )

  return (
    <Table
      columns={columns}
      data={orders}
      pageSize={ORDERS_PAGE_SIZE}
      enableRowSelection
      enableColumnResizing
      enableColumnCustomization
      columnFilters={filters.columnFilters}
      onColumnFiltersChange={filters.onColumnFiltersChange}
      toolbar={
        <FilterBar fields={ORDER_FIELDS} value={filters.values} onChange={filters.setValues} today={ORDERS_TODAY} />
      }
      emptyState="No orders match these filters"
      renderBulkActions={({ selectedRows, selectedCount, totalCount, selectAll, clearSelection }) => (
        <BulkActionBar
          selectedCount={selectedCount}
          totalCount={totalCount}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          // Picking a value applies it to every selected row straight away; the field then resets
          // to its placeholder because no `value` is held.
          fields={[
            { key: 'category', label: 'Category', options: ORDER_CATEGORIES },
            { key: 'owner', label: 'Owner', options: ORDER_OWNERS },
          ]}
          onFieldChange={(key, value) =>
            setOrders((previous) => previous.map((order) => (selectedRows.includes(order) ? { ...order, [key]: value } : order)))
          }
          actions={[
            { label: 'Export', onClick: () => {} },
            {
              label: 'Mark delivered',
              variant: 'primary',
              onClick: () =>
                setOrders((previous) =>
                  previous.map((order) => (selectedRows.includes(order) ? { ...order, status: 'delivered', fulfilled: 100 } : order)),
                ),
            },
          ]}
          // Confirming the delete (and excluding rows that can't be deleted) is the caller's job.
          onDelete={() => {
            setOrders((previous) => previous.filter((order) => !selectedRows.includes(order)))
            clearSelection()
          }}
        />
      )}
    />
  )
}

export const Example: Story = {
  render: () => <OrdersExample />,
  play: async ({ canvas, userEvent }) => {
    // Pagination: one page of the 26 orders, plus the header row.
    await expect(canvas.getAllByRole('row')).toHaveLength(ORDERS_PAGE_SIZE + 1)

    // All filters → Owner narrows the grid, and the chip for it appears in the toolbar.
    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Owner' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Jane Doe' }))
    const janeOrders = ORDERS.filter((order) => order.owner === 'o_jane').length
    await waitFor(() => expect(canvas.getAllByRole('row')).toHaveLength(Math.min(janeOrders, ORDERS_PAGE_SIZE) + 1))
    await userEvent.keyboard('{Escape}')

    // Bulk actions: selecting a row raises the bar, and Delete removes that order.
    const firstOrderNo = canvas.getAllByRole('gridcell').find((cell) => /^ORD-\d+$/.test(cell.textContent ?? ''))
    const orderNo = firstOrderNo?.textContent as string
    await userEvent.click(canvas.getAllByRole('checkbox', { name: 'Select row' })[0])
    await userEvent.click(await canvas.findByRole('button', { name: 'Delete selected' }))
    await waitFor(() => expect(canvas.queryByText(orderNo)).not.toBeInTheDocument())
  },
}
