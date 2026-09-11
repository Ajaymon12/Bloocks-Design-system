import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import { expect, screen, waitFor, within } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/Button'
import { Table } from './Table'
import { columnHeader, sortableHeader } from './columnHeader'
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
import { EmptyCell } from './cells/EmptyCell'
import { DropdownCell } from './cells/DropdownCell'
import { InputCell } from './cells/InputCell'

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

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          sm (12px)
        </h3>
        <Table columns={basicColumns} data={PEOPLE} enableSorting={false} size="sm" />
      </section>
      <section>
        <h3 style={{ margin: '0 0 12px', color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>
          md (14px, default)
        </h3>
        <Table columns={basicColumns} data={PEOPLE} enableSorting={false} size="md" />
      </section>
    </div>
  ),
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
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <AmountCell amount={row.original.amount} /> },
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
    meta: { width: 'w-16' },
    enableResizing: false,
    size: 64,
    cell: () => (
      <ActionsCell>
        <Button variant="ghost" size="xs" leadingIcon={<MoreHorizontal size={14} />} accessibilityLabel="Row actions" />
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
    cell: ({ row }) => (row.original.accountType ? <PlainTextCell>{row.original.accountType}</PlainTextCell> : <EmptyCell>Not Mapped</EmptyCell>),
  },
  {
    accessorKey: 'unreconciled',
    header: 'Unreconciled',
    cell: ({ row }) =>
      row.original.unreconciled ? (
        <span className="text-destructive">{row.original.unreconciled} Transactions</span>
      ) : (
        <EmptyCell />
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
  },
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
