import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import { expect, fn, screen, waitFor } from 'storybook/test'
import { AmountCell, DateCell, PlainTextCell, Table, columnHeader, sortableHeader } from '@/components/Table'
import { BANK_LEDGER_OPTIONS, BANK_TRANSACTIONS, labelOf } from '@/components/Filters/bankTransactions.fixtures'
import type { BankTransaction } from '@/components/Filters/bankTransactions.fixtures'
import { BulkActionBar } from './BulkActionBar'
import type { BulkActionBarProps, BulkEditField } from './BulkActionBar'

// Figma: Karbon - AI Accountant → bulk action bar (node 24444:61902). Korefi Table Standardization
// v1.5, §7.6: count · Select all N matching · bulk edit · Delete · module actions.
//
// Field names, options and action labels here are generic placeholders — a module supplies its own
// editable fields and actions.

/** "Category 1", "Category 2", … */
function placeholderOptions(label: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    value: `${label.toLowerCase()}_${index + 1}`,
    label: `${label} ${index + 1}`,
  }))
}

const FIELDS: BulkEditField[] = [
  { key: 'category', label: 'Category', options: placeholderOptions('Category', 4) },
  { key: 'account', label: 'Account', options: placeholderOptions('Account', 6) },
  { key: 'tag', label: 'Tag', options: placeholderOptions('Tag', 3) },
  { key: 'owner', label: 'Owner', options: placeholderOptions('Owner', 4) },
  { key: 'location', label: 'Location', options: placeholderOptions('Location', 3) },
]

const ACTION_LABELS = { secondary: 'Save', primary: 'Save & continue' }

const meta = {
  title: 'Components/BulkActionBar',
  component: BulkActionBar,
  tags: ['ai-generated', 'autodocs'],
  args: {
    selectedCount: 11,
    totalCount: 100,
    fields: FIELDS,
    onSelectAll: fn(),
    onFieldChange: fn(),
    onDelete: fn(),
    onClearSelection: fn(),
    actions: [
      { label: ACTION_LABELS.secondary, onClick: fn() },
      { label: ACTION_LABELS.primary, onClick: fn(), variant: 'primary' },
    ],
  },
} satisfies Meta<typeof BulkActionBar>

export default meta
type Story = StoryObj<typeof meta>

/** Holds each field's chosen value, since the bar is controlled. */
function Controlled(args: BulkActionBarProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  return (
    <BulkActionBar
      {...args}
      fields={args.fields?.map((field) => ({ ...field, value: values[field.key] ?? field.value }))}
      onFieldChange={(key, value) => {
        setValues((previous) => ({ ...previous, [key]: value }))
        args.onFieldChange?.(key, value)
      }}
    />
  )
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('11 selected')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Select all 100' }))
    await expect(args.onSelectAll).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Delete selected' }))
    await expect(args.onDelete).toHaveBeenCalledTimes(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await expect(args.onClearSelection).toHaveBeenCalledTimes(1)
  },
}

/** Pick a value in a field to set it on every selected row. The fields are searchable. */
export const SetAFieldOnAllSelected: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Account' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Account 3' }))
    await expect(args.onFieldChange).toHaveBeenCalledWith('account', 'account_3')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Account' })).toHaveTextContent('Account 3'))
  },
}

/** More fields than fit scroll sideways; the chevrons move one field at a time and stop at the ends. */
export const ScrollsWhenFieldsOverflow: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    const left = await canvas.findByRole('button', { name: 'Scroll fields left' })
    const right = canvas.getByRole('button', { name: 'Scroll fields right' })
    await expect(left).toBeDisabled()
    await expect(right).toBeEnabled()

    await userEvent.click(right)
    await waitFor(() => expect(left).toBeEnabled())
  },
}

/** Once every matching row is selected there's nothing left to "select all". */
export const AllSelected: Story = {
  args: { selectedCount: 100 },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument()
  },
}

/** Fields only — no module actions, no delete. */
export const EditOnly: Story = {
  args: { actions: [], onDelete: undefined, fields: FIELDS.slice(1, 3) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Scroll fields right' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Delete selected' })).not.toBeInTheDocument()
  },
}

// --- In a table -------------------------------------------------------------------------------

const transactionColumns: ColumnDef<BankTransaction, any>[] = [
  {
    accessorKey: 'postedOn',
    header: sortableHeader<BankTransaction>('Posted on'),
    sortingFn: 'datetime',
    cell: ({ row }) => <DateCell value={row.original.postedOn} />,
  },
  {
    accessorKey: 'narration',
    header: columnHeader<BankTransaction>('Narration'),
    cell: ({ row }) => <PlainTextCell>{row.original.narration}</PlainTextCell>,
  },
  {
    accessorKey: 'bankLedgerId',
    header: columnHeader<BankTransaction>('Bank ledger'),
    cell: ({ row }) => <PlainTextCell>{labelOf(BANK_LEDGER_OPTIONS, row.original.bankLedgerId)}</PlainTextCell>,
  },
  {
    accessorKey: 'amount',
    header: sortableHeader<BankTransaction>('Amount'),
    cell: ({ row }) => (
      <AmountCell amount={Math.abs(row.original.amount)} variant={row.original.amount < 0 ? 'debit' : 'credit'} />
    ),
  },
]

function TransactionsWithBulkActions() {
  const [values, setValues] = useState<Record<string, string>>({})
  return (
    <Table
      columns={transactionColumns}
      data={BANK_TRANSACTIONS}
      enableRowSelection
      renderBulkActions={({ selectedCount, totalCount, selectAll, clearSelection }) => (
        <BulkActionBar
          selectedCount={selectedCount}
          totalCount={totalCount}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          fields={FIELDS.map((field) => ({ ...field, value: values[field.key] }))}
          onFieldChange={(key, value) => setValues((previous) => ({ ...previous, [key]: value }))}
          actions={[
            { label: ACTION_LABELS.secondary, onClick: () => {} },
            { label: ACTION_LABELS.primary, onClick: () => {}, variant: 'primary' },
          ]}
          onDelete={() => {}}
        />
      )}
    />
  )
}

/** Selecting rows brings the bar up over the table; × deselects and dismisses it. */
export const InATable: Story = {
  render: () => <TransactionsWithBulkActions />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()

    const rowCheckboxes = canvas.getAllByRole('checkbox', { name: 'Select row' })
    await userEvent.click(rowCheckboxes[0])
    await userEvent.click(rowCheckboxes[1])
    await expect(await canvas.findByText('2 selected')).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: `Select all ${BANK_TRANSACTIONS.length}` }))
    await expect(await canvas.findByText(`${BANK_TRANSACTIONS.length} selected`)).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await waitFor(() => expect(canvas.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument())
  },
}
