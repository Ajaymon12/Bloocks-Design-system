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

/** Focus stays in the search box while the arrow keys move a highlight through the options (skipping
 *  disabled ones); Enter toggles the highlighted option. Typing narrows the list and re-homes the
 *  highlight to the first match. */
export const KeyboardNavigation: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    const search = await screen.findByPlaceholderText('Search…')
    const highlighted = () => document.getElementById(search.getAttribute('aria-activedescendant') ?? '')

    await expect(highlighted()).toHaveTextContent('Sales')
    await userEvent.keyboard('{ArrowDown}')
    await expect(highlighted()).toHaveTextContent('Engineering')

    // Enter ticks the highlighted option — the panel stays open in multi mode.
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Engineering' })).toBeChecked())
    await expect(search).toBeVisible()

    // Project Beta is disabled, so ArrowUp from Sales wraps to Project Alpha, not Beta.
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await expect(highlighted()).toHaveTextContent('Project Alpha')

    await userEvent.keyboard('mark')
    await expect(highlighted()).toHaveTextContent('Marketing')
  },
}

/** "Add new" turns into a focused input; Enter adds the option to its group and selects it. The parent
 *  owns `groups`, so it appends the option in `onAddOption`. */
function WithAdd(args: React.ComponentProps<typeof FilterDropdown>) {
  const [groups, setGroups] = useState(args.groups)
  const [value, setValue] = useState<string[]>([])
  return (
    <FilterDropdown
      {...args}
      groups={groups}
      value={value}
      onChange={setValue}
      onAddOption={(option, groupLabel) =>
        setGroups((previous) => previous.map((group) => (group.label === groupLabel ? { ...group, options: [...group.options, option] } : group)))
      }
    />
  )
}

export const AddNewOption: Story = {
  render: (args) => <WithAdd {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.click((await screen.findAllByRole('button', { name: 'Add new' }))[0])

    // The input is focused straight away, so the user can just type the name.
    await expect(await screen.findByLabelText('New item name')).toHaveFocus()
    await userEvent.keyboard('Finance{Enter}')

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Finance' })).toBeChecked())
    await expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Finance')
  },
}

/** Same inline add in single-select mode: the new option replaces whatever was selected. */
export const AddNewOptionSingleSelect: Story = {
  args: { mode: 'single' },
  render: (args) => <WithAdd {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Filter by department' }))
    await userEvent.click(await screen.findByText('Sales'))
    await userEvent.click((await screen.findAllByRole('button', { name: 'Add new' }))[0])
    await userEvent.keyboard('Finance{Enter}')

    // Finance replaces Sales rather than joining it.
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Filter by department' })).toHaveTextContent('Department: Finance')
    })
    await expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await expect(screen.getByRole('option', { name: 'Finance' })).toHaveAttribute('aria-selected', 'true')
    await expect(screen.getByRole('option', { name: 'Sales' })).toHaveAttribute('aria-selected', 'false')
  },
}
