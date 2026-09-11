import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { ColumnCustomizer, ColumnCustomizerPanel } from './ColumnCustomizer'
import type { ColumnCustomizerItem } from './ColumnCustomizer'

// Figma: Karbon - AI Accountant → "Chargeback columns"
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=25306-142914
// Every change commits immediately — there is no Apply step, matching the live-filter decision
// made for FilterDropdown. Reordering is HTML5 drag for the mouse and Alt+↑/↓ on a focused grip
// for the keyboard; the play functions exercise the keyboard path, since HTML5 drag-and-drop
// can't be driven by userEvent.

const COLUMNS: ColumnCustomizerItem[] = [
  { id: 'date', label: 'Date', visible: true, locked: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'ledger', label: 'Ledger', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'amount', label: 'Amount', visible: true },
  { id: 'gst', label: 'GST Registration', visible: false },
  { id: 'bank', label: 'Bank Allocation', visible: false },
  { id: 'voucher', label: 'Voucher No.', visible: false },
  { id: 'cost-centre', label: 'Cost Centre', visible: false },
  { id: 'cheque', label: 'Cheque/Instrument No.', visible: false },
  { id: 'supplier', label: 'Supplier/Reference No.', visible: false },
  { id: 'reviewed', label: 'Reviewed', visible: true, locked: true },
]

const meta = {
  title: 'Components/ColumnCustomizer',
  component: ColumnCustomizer,
  tags: ['ai-generated', 'autodocs'],
  args: { items: COLUMNS, onChange: () => {} },
} satisfies Meta<typeof ColumnCustomizer>

export default meta
type Story = StoryObj<typeof meta>

/** Mirrors real usage: the parent owns the column layout and re-renders its table on change. */
function ControlledPanel(args: Partial<React.ComponentProps<typeof ColumnCustomizerPanel>>) {
  const [items, setItems] = useState<ColumnCustomizerItem[]>(args.items ?? COLUMNS)
  return (
    <div className="w-[300px] rounded-[var(--radius-12)] border border-[var(--color-popover-border)] bg-card shadow-[var(--shadow-popover)]">
      <ColumnCustomizerPanel
        {...args}
        items={items}
        onChange={setItems}
        onResetWidth={args.onResetWidth ?? (() => {})}
        onResetDefault={() => setItems(args.items ?? COLUMNS)}
      />
    </div>
  )
}

function ControlledPopover(args: React.ComponentProps<typeof ColumnCustomizer>) {
  const [items, setItems] = useState<ColumnCustomizerItem[]>(args.items)
  return (
    <ColumnCustomizer
      {...args}
      items={items}
      onChange={setItems}
      onResetWidth={() => {}}
      onResetDefault={() => setItems(args.items)}
    />
  )
}

/** The shipping form: a "Columns" trigger that opens the panel in a popover. */
export const Default: Story = {
  render: (args) => <ControlledPopover {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Customize columns' }))
    // waitFor: the panel fades in over 120ms, so it starts at opacity 0. Asserting on the search
    // row rather than the "Columns" heading — the trigger button carries that same label.
    await waitFor(() => expect(screen.getByPlaceholderText('Search…')).toBeVisible())
    await expect(screen.getByRole('button', { name: 'Reorder Ledger' })).toBeVisible()
  },
}

/** The panel on its own, without the floating layer — the full anatomy in one view. */
export const Panel: Story = {
  render: () => <ControlledPanel />,
}

/** Locked columns (Date, Reviewed) swap the grip + checkbox for a lock glyph and carry no pin
 *  control at all — they can't be hidden, moved or pinned. */
export const LockedColumns: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Reorder Date' })).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /Pin Date/ })).not.toBeInTheDocument()
    // A non-locked row has both affordances.
    await expect(canvas.getByRole('button', { name: 'Reorder Ledger' })).toBeEnabled()
    await expect(canvas.getByRole('button', { name: 'Pin Ledger' })).toBeEnabled()
  },
}

/** The pin is a secondary affordance: transparent at rest, revealed on row hover or focus. It
 *  stays in the DOM throughout, so it remains keyboard- and screen-reader reachable.
 *
 *  The hover half can't be asserted here — `userEvent.hover` dispatches synthetic pointer events,
 *  which never set the browser's real `:hover` state, so the CSS wouldn't fire. Hover the row in
 *  this story to see it; the focus path below covers the same rule from the keyboard side. */
export const PinRevealsOnHover: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas }) => {
    const pin = canvas.getByRole('button', { name: 'Pin Ledger' })
    // toBeInTheDocument, not toBeVisible: jest-dom counts opacity 0 as invisible, and being
    // present-but-transparent is precisely the resting state this asserts.
    await expect(pin).toBeInTheDocument()
    await expect(getComputedStyle(pin).opacity).toBe('0')

    pin.focus()
    await waitFor(() => expect(getComputedStyle(pin).opacity).toBe('1'))
  },
}

/** Once pinned, the icon is opaque unconditionally — it no longer depends on hover, so the state
 *  stays readable at rest while every other row's pin is still quiet. */
export const PinnedStaysVisible: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Pin Ledger' }))

    await waitFor(() => {
      expect(getComputedStyle(canvas.getByRole('button', { name: 'Unpin Ledger' })).opacity).toBe('1')
    })
    // An unpinned neighbour is still transparent, so "pinned" reads as a difference.
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Pin Amount' })).opacity).toBe('0')
  },
}

export const HidingColumns: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    const ledger = canvas.getByRole('checkbox', { name: 'Ledger' })
    await expect(ledger).toBeChecked()

    // Clicking the label toggles it — the 12px box alone is too small a target.
    await userEvent.click(canvas.getByText('Ledger'))
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: 'Ledger' })).not.toBeChecked())
  },
}

/** Toggling a column regroups the list: everything shown sits in one block, hidden ones below.
 *  Ticking a hidden column on lifts it to the end of the shown group rather than leaving it
 *  stranded among the hidden rows. */
export const ShownColumnsStayGrouped: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    // "Cost Centre" starts hidden, well down the list among the other hidden columns.
    const before = canvas.getAllByRole('listitem').map((row) => row.textContent)
    expect(before.findIndex((label) => label?.includes('Cost Centre'))).toBe(8)

    await userEvent.click(canvas.getByText('Cost Centre'))

    await waitFor(() => {
      const after = canvas.getAllByRole('listitem').map((row) => row.textContent ?? '')
      // It lands right after Amount, the last of the already-shown columns.
      expect(after[5]).toContain('Cost Centre')
      // And the shown block is contiguous: no hidden row sits above a shown one.
      const checked = canvas.getAllByRole('checkbox').map((box) => box.getAttribute('aria-checked') === 'true')
      expect(checked.lastIndexOf(true)).toBeLessThan(checked.indexOf(false))
    })
  },
}

/** Hiding a column sends it the other way — down to the top of the hidden block. */
export const HidingSinksToTheHiddenGroup: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    const before = canvas.getAllByRole('listitem').map((row) => row.textContent)
    expect(before.findIndex((label) => label?.includes('Description'))).toBe(1)

    await userEvent.click(canvas.getByText('Description'))

    await waitFor(() => {
      const after = canvas.getAllByRole('listitem').map((row) => row.textContent ?? '')
      // Four shown columns remain above it (Date is locked and anchored first).
      expect(after[4]).toContain('Description')
    })
  },
}

/** The keyboard reorder path: Alt+↓ on a focused grip moves the column down one place. */
export const KeyboardReorder: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    const labelsBefore = canvas.getAllByRole('listitem').map((row) => row.textContent)
    expect(labelsBefore[1]).toContain('Description')
    expect(labelsBefore[2]).toContain('Ledger')

    canvas.getByRole('button', { name: 'Reorder Description' }).focus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')

    await waitFor(() => {
      const labelsAfter = canvas.getAllByRole('listitem').map((row) => row.textContent)
      expect(labelsAfter[1]).toContain('Ledger')
      expect(labelsAfter[2]).toContain('Description')
    })
  },
}

/** Alt+↑ on the first movable row is a no-op — it won't jump over the locked Date column. */
export const ReorderStopsAtLockedColumns: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    canvas.getByRole('button', { name: 'Reorder Description' }).focus()
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')

    const labels = canvas.getAllByRole('listitem').map((row) => row.textContent)
    expect(labels[0]).toContain('Date')
    expect(labels[1]).toContain('Description')
  },
}

export const Pinning: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Pin Ledger' }))
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Unpin Ledger' })).toHaveAttribute('aria-pressed', 'true'))
  },
}

/** The glyph names the action: an unpinned column offers "pin", a pinned one offers "unpin"
 *  (the struck-through variant). Lucide tags each icon with a `lucide-<name>` class. */
export const PinIconSwapsOnToggle: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    const pin = canvas.getByRole('button', { name: 'Pin Ledger' })
    await expect(pin.querySelector('.lucide-pin')).toBeInTheDocument()
    await expect(pin.querySelector('.lucide-pin-off')).not.toBeInTheDocument()

    await userEvent.click(pin)

    await waitFor(() => {
      const unpin = canvas.getByRole('button', { name: 'Unpin Ledger' })
      expect(unpin.querySelector('.lucide-pin-off')).toBeInTheDocument()
    })

    // And back again, so the swap isn't one-way.
    await userEvent.click(canvas.getByRole('button', { name: 'Unpin Ledger' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Pin Ledger' }).querySelector('.lucide-pin')).toBeInTheDocument()
    })
  },
}

/** Searching hides the grips: reordering a filtered subset has no coherent meaning. */
export const Search: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText('Search…'), 'bank')

    await expect(await canvas.findByText('Bank Allocation')).toBeVisible()
    await expect(canvas.queryByText('Ledger')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: /^Reorder/ })).not.toBeInTheDocument()
  },
}

export const NoMatches: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText('Search…'), 'zzz')
    await expect(await canvas.findByText(/No matches for/)).toBeVisible()
  },
}

/** Reset Default restores visibility, order and pinning together. */
export const ResetDefault: Story = {
  render: () => <ControlledPanel />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Ledger'))
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: 'Ledger' })).not.toBeChecked())

    await userEvent.click(canvas.getByRole('button', { name: 'Reset Default' }))
    await waitFor(() => expect(canvas.getByRole('checkbox', { name: 'Ledger' })).toBeChecked())
  },
}
