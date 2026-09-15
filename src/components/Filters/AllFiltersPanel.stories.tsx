import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor, within } from 'storybook/test'
import { AllFiltersPanel } from './AllFiltersPanel'
import {
  ACCEPTED_BY_FIELD,
  BANK_LEDGER_OPTIONS,
  FILTERS_TODAY,
  SOURCE_FIELD,
  STATUS_FIELD,
  VOUCHER_TYPE_FIELD,
  bankFilterFields,
  createFakeLoader,
} from './bankTransactions.fixtures'

// HubSpot-style "All filters" panel — Korefi Table Standardization v1.5, §6.1 / §7.2, and the
// product team's sample (Status / Source / Accepted by). Filtering is live: every change reaches
// `onChange` immediately. Rendered inline here, not in its popover, so the layout can be inspected
// directly; see FilterBar for it in context.

const BANK_FIELDS = bankFilterFields()

const meta = {
  title: 'Components/Filters/AllFiltersPanel',
  component: AllFiltersPanel,
  tags: ['ai-generated', 'autodocs'],
  args: { fields: BANK_FIELDS, value: {}, onChange: fn(), today: FILTERS_TODAY },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'inline-block',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid var(--color-border-subtle)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AllFiltersPanel>

export default meta
type Story = StoryObj<typeof meta>

/** Every field is listed; there's no Apply — nothing is staged. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('tab')).toHaveLength(4)
    await expect(canvas.getByRole('tab', { name: 'Bank ledger' })).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByRole('button', { name: 'Reset' })).toBeDisabled()
    await expect(canvas.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
  },
}

/** The sample's look: an enum whose options are coloured status Badges, checkbox on the right. */
export const StatusBadges: Story = {
  args: { fields: [STATUS_FIELD, SOURCE_FIELD, ACCEPTED_BY_FIELD] },
  play: async ({ args, canvas, userEvent }) => {
    const reconciled = canvas.getByRole('checkbox', { name: 'Reconciled' })
    await userEvent.click(reconciled)
    await expect(reconciled).toBeChecked()
    await expect(canvas.getByRole('tab', { name: 'Status, 1 selected' })).toBeInTheDocument()
    await expect(args.onChange).toHaveBeenLastCalledWith({ status: ['reconciled'] })
  },
}

/** Each tick filters straight away, across as many fields as you like. */
export const FiltersAsYouGo: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Account type' }))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Savings' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ accountType: ['savings'] })

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Current' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({ accountType: ['savings', 'current'] })

    await userEvent.click(canvas.getByRole('tab', { name: 'Account type, 2 selected' }))
    await userEvent.click(canvas.getByRole('tab', { name: 'Date' }))
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Date range' }), 'This month')
    await expect(args.onChange).toHaveBeenLastCalledWith({
      accountType: ['savings', 'current'],
      date: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 15) },
    })
  },
}

/** Reset clears every field at once. */
export const ResetClearsEverything: Story = {
  args: {
    value: { accountType: ['savings'], date: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 15) } },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }))
    await expect(args.onChange).toHaveBeenLastCalledWith({})
    await expect(canvas.queryByRole('tab', { name: /selected/ })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Reset' })).toBeDisabled()
  },
}

/** "All filters opens with a search box on field names" (spec §7.2). */
export const SearchFieldNames: Story = {
  play: async ({ canvas, userEvent }) => {
    const search = canvas.getByRole('textbox', { name: 'Search filters' })
    await userEvent.type(search, 'bank')
    await expect(canvas.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Bank ledger', 'Bank name'])

    await userEvent.clear(search)
    await userEvent.type(search, 'zzz')
    await expect(canvas.getByText('No matches for “zzz”')).toBeVisible()
  },
}

/** A date only filters once it's a whole range — never on a From without a To. */
export const DateWaitsUntilComplete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Date' }))
    await userEvent.click(canvas.getByRole('textbox', { name: 'From date, day' }))
    await userEvent.keyboard('01092026')
    await expect(args.onChange).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('textbox', { name: 'To date, day' }))
    await userEvent.keyboard('10092026')
    await expect(args.onChange).toHaveBeenLastCalledWith({ date: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 10) } })
  },
}

/** Entity options load asynchronously; the list shows a loading state meanwhile. */
export const EntityRefLoading: Story = {
  args: { fields: bankFilterFields({ bankLedgerLoader: createFakeLoader(BANK_LEDGER_OPTIONS, { mode: 'pending' }) }) },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('status')).toHaveTextContent('Loading…')
  },
}

export const EntityRefEmpty: Story = {
  args: { fields: bankFilterFields({ bankLedgerLoader: createFakeLoader(BANK_LEDGER_OPTIONS, { mode: 'empty', delayMs: 20 }) }) },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('No options')).toBeVisible()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search Bank ledger' }), 'xyz')
    await expect(await canvas.findByText('No matches for “xyz”', undefined, { timeout: 2000 })).toBeVisible()
  },
}

const failingLoader = createFakeLoader(BANK_LEDGER_OPTIONS, { mode: 'error', delayMs: 20 })

/** A failed load says so and offers Retry, which asks the loader again. */
export const EntityRefError: Story = {
  args: { fields: bankFilterFields({ bankLedgerLoader: failingLoader }) },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('Couldn’t load bank ledger options')).toBeVisible()
    const callsBefore = failingLoader.calls.length
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(failingLoader.calls.length).toBeGreaterThan(callsBefore))
  },
}

/** A selection that isn't in the current results (restored filter) is pinned on top, with its label
 * fetched through `resolveOptions`. */
export const EntityRefSelectedPinned: Story = {
  args: {
    fields: bankFilterFields({ bankLedgerLoader: createFakeLoader(BANK_LEDGER_OPTIONS.slice(0, 4), { delayMs: 20 }) }),
    value: { bankLedger: ['l_kotak_current'] },
  },
  play: async ({ canvas }) => {
    const selected = await canvas.findByRole('group', { name: 'Selected' })
    await waitFor(() => expect(within(selected).getByRole('checkbox', { name: 'Kotak Current A/c - 6630' })).toBeChecked())
  },
}

/** Checklists over eight options get a search box; short ones don't. */
export const EnumSearchOverEight: Story = {
  args: { fields: [VOUCHER_TYPE_FIELD, ...BANK_FIELDS] },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('textbox', { name: 'Search Voucher type' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('tab', { name: 'Account type' }))
    await expect(canvas.queryByRole('textbox', { name: 'Search Account type' })).not.toBeInTheDocument()
  },
}

/** The field list is a vertical tablist: arrows move and select, Home/End jump to the ends. */
export const KeyboardNavigation: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Bank ledger' }))
    await userEvent.keyboard('{ArrowDown}')
    const accountType = canvas.getByRole('tab', { name: 'Account type' })
    await expect(accountType).toHaveAttribute('aria-selected', 'true')
    await expect(accountType).toHaveFocus()

    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('tab', { name: 'Date' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(canvas.getByRole('tab', { name: 'Bank ledger' })).toHaveAttribute('aria-selected', 'true')
  },
}
