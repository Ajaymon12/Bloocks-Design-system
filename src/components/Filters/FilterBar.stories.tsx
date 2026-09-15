import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { AmountCell, DateCell, PlainTextCell, Table, columnHeader, dateColumnHeader, sortableHeader } from '@/components/Table'
import { FilterBar } from './FilterBar'
import type { FilterBarProps } from './FilterBar'
import { serializeFilterValues } from './filterModel'
import { useTableFilterState } from './tableAdapter'
import type { FilterValues } from './types'
import {
  ACCOUNT_TYPE_OPTIONS,
  BANK_LEDGER_OPTIONS,
  BANK_OPTIONS,
  BANK_TRANSACTIONS,
  FILTERS_TODAY,
  bankFilterFields,
  labelOf,
} from './bankTransactions.fixtures'
import type { BankTransaction } from './bankTransactions.fixtures'

// The table filter row — Korefi Table Standardization v1.5, §7.2: quick-filter chips + All filters,
// both editing one controlled value, and filtering live (no Apply). For the bank table only Bank ledger
// is a quick filter; Account type, Bank name and Date live in All filters and gain a chip once applied.

const BANK_FIELDS = bankFilterFields()

const meta = {
  title: 'Components/Filters/FilterBar',
  component: FilterBar,
  tags: ['ai-generated', 'autodocs'],
  args: { fields: BANK_FIELDS, value: {}, onChange: fn(), today: FILTERS_TODAY },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: FilterBarProps) {
  const [value, setValue] = useState<FilterValues>(args.value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FilterBar
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next)
          args.onChange(next)
        }}
      />
      <pre data-testid="committed" style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {JSON.stringify(serializeFilterValues(args.fields, value))}
      </pre>
    </div>
  )
}

/** Only the quick filter has a chip until something else is applied. */
export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Bank ledger' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Account type' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'All filters' })).toBeVisible()
  },
}

/** Pick filters across fields in one panel — each applies as it's ticked, and gets a chip. */
export const FiltersApplyAsYouTick: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Account type' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Savings' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Account type' })).toHaveTextContent('Account type: Savings'))

    await userEvent.click(screen.getByRole('tab', { name: 'Bank name' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'ICICI Bank' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Bank name' })).toHaveTextContent('Bank name: ICICI Bank'))
    await expect(canvas.getByRole('button', { name: 'All filters, 2 active' })).toBeVisible()
    await expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
  },
}

/** A chip and the panel edit the same state: what the chip applied, the panel shows. */
export const QuickChipEditsSameState: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank ledger' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'HDFC Current A/c - 4521' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Bank ledger' })).toHaveTextContent('Bank ledger: HDFC Current A/c - 4521'),
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(canvas.getByRole('button', { name: 'All filters, 1 active' }))
    await expect(await screen.findByRole('tab', { name: 'Bank ledger, 1 selected' })).toHaveAttribute('aria-selected', 'true')
    await expect(await screen.findByRole('checkbox', { name: 'HDFC Current A/c - 4521' })).toBeChecked()
  },
}

/** A chip's × clears that filter straight away. */
export const ClearChip: Story = {
  args: { value: { accountType: ['savings'] } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Account type' })).toHaveTextContent('Account type: Savings')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Account type value' }))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Account type' })).not.toBeInTheDocument())
    await expect(canvas.getByRole('button', { name: 'All filters' })).toBeVisible()
  },
}

/** Nothing is staged, so closing the panel keeps what was ticked. */
export const ChangesStayAfterClosing: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Account type' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Savings' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await expect(canvas.getByRole('button', { name: 'Account type' })).toHaveTextContent('Account type: Savings')
    await expect(args.onChange).toHaveBeenLastCalledWith({ accountType: ['savings'] })
  },
}

/** Financial-year presets (April–March). The chip names the preset rather than two dates. */
export const DateFiscalPresets: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Date' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'Last FY')

    await waitFor(() => expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('Date: Last FY'))
    await expect(canvas.getByTestId('committed')).toHaveTextContent('"date":{"from":"2025-04-01","to":"2026-03-31"}')
  },
}

/** In February the financial year is the one that started the previous April. */
export const FiscalYearCrossesCalendarYear: Story = {
  args: { today: new Date(2026, 1, 15) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Date' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Date range' }), 'This FY')

    await waitFor(() => expect(canvas.getByTestId('committed')).toHaveTextContent('"date":{"from":"2025-04-01","to":"2026-02-15"}'))
  },
}

// --- Driving a Table --------------------------------------------------------------------------

const bankTransactionColumns: ColumnDef<BankTransaction, any>[] = [
  {
    accessorKey: 'postedOn',
    header: dateColumnHeader<BankTransaction>('Posted on', { today: FILTERS_TODAY }),
    sortingFn: 'datetime',
    filterFn: 'dateRange',
    meta: { title: 'Posted on', filterType: 'date' },
    cell: ({ row }) => <DateCell value={row.original.postedOn} />,
  },
  {
    accessorKey: 'narration',
    header: columnHeader<BankTransaction>('Narration'),
    meta: { title: 'Narration' },
    cell: ({ row }) => <PlainTextCell>{row.original.narration}</PlainTextCell>,
  },
  {
    accessorKey: 'bankLedgerId',
    header: columnHeader<BankTransaction>('Bank ledger'),
    filterFn: 'anyOf',
    meta: { title: 'Bank ledger' },
    cell: ({ row }) => <PlainTextCell>{labelOf(BANK_LEDGER_OPTIONS, row.original.bankLedgerId)}</PlainTextCell>,
  },
  {
    accessorKey: 'bankId',
    header: columnHeader<BankTransaction>('Bank name'),
    filterFn: 'anyOf',
    meta: { title: 'Bank name' },
    cell: ({ row }) => <PlainTextCell>{labelOf(BANK_OPTIONS, row.original.bankId)}</PlainTextCell>,
  },
  {
    accessorKey: 'accountType',
    header: columnHeader<BankTransaction>('Account type'),
    filterFn: 'anyOf',
    meta: { title: 'Account type' },
    cell: ({ row }) => <PlainTextCell>{labelOf(ACCOUNT_TYPE_OPTIONS, row.original.accountType)}</PlainTextCell>,
  },
  {
    accessorKey: 'amount',
    header: sortableHeader<BankTransaction>('Amount'),
    meta: { title: 'Amount' },
    cell: ({ row }) => (
      <AmountCell amount={Math.abs(row.original.amount)} variant={row.original.amount < 0 ? 'debit' : 'credit'} />
    ),
  },
]

function BankTransactionsTable() {
  const filters = useTableFilterState(BANK_FIELDS)
  return (
    <Table
      columns={bankTransactionColumns}
      data={BANK_TRANSACTIONS}
      columnFilters={filters.columnFilters}
      onColumnFiltersChange={filters.onColumnFiltersChange}
      enableColumnCustomization
      toolbar={<FilterBar fields={BANK_FIELDS} value={filters.values} onChange={filters.setValues} today={FILTERS_TODAY} />}
    />
  )
}

/** The bar sits in the Table's toolbar (Columns stays right) and its filters remove rows. */
export const DrivesATable: Story = {
  render: () => <BankTransactionsTable />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('row')).toHaveLength(15) // header + 14
    await expect(canvas.getByRole('button', { name: 'Customize columns' })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'All filters' }))
    await userEvent.click(await screen.findByRole('tab', { name: 'Account type' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Savings' }))

    await waitFor(() => expect(canvas.getAllByRole('row')).toHaveLength(4)) // header + 3 savings rows
  },
}

/** A filter set from the column header flows back into the bar, so the Date chip appears. */
export const HeaderDateFilterSyncsChip: Story = {
  render: () => <BankTransactionsTable />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter Posted on' }))
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Date range' }), 'Last 30 days')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('Date: 17 Aug – 15 Sep 2026'))
    await expect(canvas.getAllByRole('row')).toHaveLength(8) // header + 7 rows since 17 Aug
  },
}

/** Arrow keys on a toolbar chip stay in the toolbar instead of jumping into the grid. */
export const ToolbarArrowKeysStayInToolbar: Story = {
  render: () => <BankTransactionsTable />,
  play: async ({ canvas, userEvent }) => {
    canvas.getByRole('button', { name: 'Bank ledger' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(document.activeElement?.getAttribute('role')).not.toBe('gridcell')
  },
}
