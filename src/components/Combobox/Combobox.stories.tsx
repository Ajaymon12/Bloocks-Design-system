import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { Combobox } from './Combobox'
import type { ComboboxOption } from './Combobox'

// Figma: AIA - Component Library, Dropdowns → "Dropdown multi selete" / "Customer name"
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=653-11013
// The Figma spec was the starting point, not a contract — it covers the resting look but not the
// interaction surface, so this adds full keyboard support, listbox/option ARIA semantics, a clear
// button, disabled/loading/error states, and a panel that matches the trigger's width.
// Built on Radix Popover (not DropdownMenu — its own typeahead fights the search input).

const BANKS: ComboboxOption[] = [
  { value: 'hdfc', label: 'HDFC Bank' },
  { value: 'icici', label: 'ICICI Bank' },
  { value: 'axis', label: 'Axis Bank' },
  { value: 'kotak', label: 'Kotak Mahindra Bank' },
  { value: 'sbi', label: 'State Bank of India' },
  { value: 'yes', label: 'Yes Bank', disabled: true },
]

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['ai-generated', 'autodocs'],
  args: { options: BANKS, label: 'Bank' },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState(args.value)
  return <Combobox {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Select…')).toBeVisible()
  },
}

export const WithSelectedValue: Story = {
  args: { value: 'kotak', showClearButton: true, helpText: 'The account this voucher settles into.' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Kotak Mahindra Bank')).toBeVisible()
  },
}

// The panel portals outside the story root, so its contents are queried via `screen`, not `canvas`.
export const SearchAndSelect: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank' }))
    await userEvent.type(await screen.findByRole('combobox'), 'kotak')

    await expect(screen.queryByText('HDFC Bank')).not.toBeInTheDocument()
    await userEvent.click(await screen.findByRole('option', { name: /Kotak Mahindra Bank/ }))

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Bank' })).toHaveTextContent('Kotak Mahindra Bank')
    })
  },
}

// The headline fix: the list is fully operable from the keyboard, with the search input keeping
// DOM focus and `aria-activedescendant` tracking the highlighted option.
export const KeyboardNavigation: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank' }))
    const search = await screen.findByRole('combobox')

    // Opens highlighting the first option, arrows move down the list.
    await waitFor(() => expect(search).toHaveAttribute('aria-activedescendant'))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Bank' })).toHaveTextContent('Axis Bank')
    })
  },
}

export const SkipsDisabledOptions: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank' }))
    await expect(await screen.findByRole('option', { name: /Yes Bank/ })).toHaveAttribute('aria-disabled', 'true')

    // End jumps to the last *selectable* option, stepping over the disabled one.
    await userEvent.keyboard('{End}{Enter}')
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Bank' })).toHaveTextContent('State Bank of India')
    })
  },
}

export const ClearSelection: Story = {
  args: { value: 'axis', showClearButton: true },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Axis Bank')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await waitFor(() => expect(canvas.getByText('Select…')).toBeVisible())
  },
}

export const ErrorState: Story = {
  args: { errorText: 'Pick a bank to continue.', necessityIndicator: 'required' },
}

export const Disabled: Story = {
  args: { value: 'hdfc', isDisabled: true },
}

export const Loading: Story = {
  args: { isLoading: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank' }))
    // waitFor, not a bare assertion: the panel fades in over 120ms, so it is legitimately at
    // opacity 0 for the first frame after opening.
    await waitFor(() => expect(screen.getByText('Loading…')).toBeVisible())
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Combobox {...args} size="sm" label="Small" value="hdfc" />
      <Combobox {...args} size="md" label="Medium (default)" value="hdfc" />
    </div>
  ),
}

const CUSTOMERS: ComboboxOption[] = [
  { value: 'acme', label: 'Acme Corp' },
  { value: 'beta', label: 'Beta Inc' },
  { value: 'gamma', label: 'Gamma LLC' },
]

export const WithCreateAction: Story = {
  args: {
    options: CUSTOMERS,
    label: 'Customer',
    placeholder: 'Select customer',
    onCreate: { label: 'Add Customer', onSelect: () => {} },
  },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Customer' }))
    await waitFor(() => expect(screen.getByText(/Add Customer/)).toBeVisible())
  },
}

export const NoResults: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Bank' }))
    await userEvent.type(await screen.findByRole('combobox'), 'zzz')
    await waitFor(() => expect(screen.getByText(/No matches for/)).toBeVisible())
  },
}
