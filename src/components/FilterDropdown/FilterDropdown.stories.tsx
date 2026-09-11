import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownGroup } from './FilterDropdown'

// Figma: AIA - Component Library, Dropdowns → "Dropdown/Ledger/Cost Centre"
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=654-11379
// Deliberate departure from the Figma spec: filtering is live, so there's no Apply button and no
// staged state — ticking a box fires `onChange` immediately. A "Reset" in the footer (which only
// appears once something is selected) replaces the spec's Clear filter / Apply pair.
// The spec's third variant ("Non") is a nested tree, deferred as a separate Tree component.

const GROUPS: FilterDropdownGroup[] = [
  {
    label: 'Department',
    options: [
      { value: 'sales', label: 'Sales' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'marketing', label: 'Marketing' },
    ],
  },
  {
    label: 'Project',
    options: [
      { value: 'alpha', label: 'Project Alpha' },
      { value: 'beta', label: 'Project Beta', disabled: true },
    ],
  },
]

const meta = {
  title: 'Components/FilterDropdown',
  component: FilterDropdown,
  tags: ['ai-generated', 'autodocs'],
  args: { groups: GROUPS, triggerLabel: 'Department', accessibilityLabel: 'Filter by department' },
} satisfies Meta<typeof FilterDropdown>

export default meta
type Story = StoryObj<typeof meta>

/** Mirrors real usage: the parent owns the filter value and re-queries on every change. */
function Controlled(args: React.ComponentProps<typeof FilterDropdown>) {
  const [value, setValue] = useState<string[]>(args.defaultValue ?? [])
  return <FilterDropdown {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filter by department' })).toBeVisible()
  },
}

// The core behavior change: one click filters, no Apply step.
export const AppliesImmediately: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.click(await screen.findByText('Engineering'))

    // Trigger updates while the panel is still open — nothing to confirm.
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Engineering')
    })
    await expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
  },
}

export const SingleSelectionNamedOnTrigger: Story = {
  args: { defaultValue: ['sales'] },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Sales')
  },
}

export const MultipleSelectionsShowCount: Story = {
  args: { defaultValue: ['sales', 'engineering'] },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2')).toBeVisible()
  },
}

// The footer (count + Reset) only exists while something is selected.
export const ResetClearsEverything: Story = {
  args: { defaultValue: ['sales', 'engineering'] },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    // waitFor: the panel fades in over 120ms, so it starts at opacity 0.
    await waitFor(() => expect(screen.getByText('2 selected')).toBeVisible())

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department')
    })
    await expect(screen.queryByText('Reset')).not.toBeInTheDocument()
  },
}

export const SelectAllPerGroup: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Select all' }))

    // All three Department options — the disabled Project option is never swept in.
    await waitFor(() => expect(canvas.getByText('3')).toBeVisible())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear' })).toBeVisible())
  },
}

export const SingleSelectMode: Story = {
  args: { mode: 'single' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.click(await screen.findByText('Sales'))
    await userEvent.click(await screen.findByText('Engineering'))

    // Picking a second option replaces the first rather than adding to it.
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Engineering')
    })
  },
}

export const SearchFilters: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.type(await screen.findByPlaceholderText('Search…'), 'alpha')
    await expect(await screen.findByText('Project Alpha')).toBeVisible()
    await expect(screen.queryByText('Sales')).not.toBeInTheDocument()
  },
}

export const NoResults: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.type(await screen.findByPlaceholderText('Search…'), 'zzz')
    await expect(await screen.findByText(/No matches for/)).toBeVisible()
  },
}

export const Uncontrolled: Story = {
  args: { defaultValue: ['marketing'] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Marketing')
  },
}
