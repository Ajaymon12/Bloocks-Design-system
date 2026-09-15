import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { FilterChip } from './FilterChip'

// Modelled on Blade's BaseFilterChip:
// https://blade.razorpay.com/?path=/docs/components-basefilterchip--docs
// The chip is presentational and always controlled — selection lives in whatever it triggers.
// FilterDropdown uses it as its Popover trigger; see Components/FilterDropdown.
// Deliberate departure from Blade: a solid border in both states rather than dashed-when-empty,
// with the tint carrying selection, to stay consistent with the rest of this system.

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  tags: ['ai-generated', 'autodocs'],
  args: { label: 'Department' },
} satisfies Meta<typeof FilterChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Department' })).toBeVisible()
    // Nothing selected, so there is nothing to clear.
    await expect(canvas.queryByRole('button', { name: /^Clear/ })).not.toBeInTheDocument()
  },
}

/** A single selection is spelled out after the label. */
export const SingleSelection: Story = {
  args: { value: 'Sales' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Department: Sales' })).toBeVisible()
  },
}

/** More than one collapses to a count — a list of names would blow out the chip's width. */
export const MultipleSelections: Story = {
  args: { value: ['Sales', 'Engineering', 'Marketing'], selectionType: 'multiple' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3')).toBeVisible()
  },
}

/** With `selectionType="multiple"`, exactly one selection still shows its name rather than "1". */
export const MultipleWithOneSelected: Story = {
  args: { value: ['Sales'], selectionType: 'multiple' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Department: Sales' })).toBeVisible()
    await expect(canvas.queryByText('1')).not.toBeInTheDocument()
  },
}

/** Blade's own story: the clear button only exists once something is selected, and
 *  `showClearButton={false}` suppresses it for filters that must always hold a value. */
export const ClearButtonBehaviour: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<string | string[]>(['Sales', 'Engineering'])
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <FilterChip
            label="Clearable"
            value={value}
            selectionType="multiple"
            onClearButtonClick={() => setValue([])}
          />
          <FilterChip label="Empty (nothing to clear)" />
          <FilterChip label="Mandatory" value="Last 30 days" showClearButton={false} />
        </div>
      )
    }
    return <Demo />
  },
  play: async ({ canvas, userEvent }) => {
    // A chip that must always hold a value never offers a clear.
    await expect(canvas.queryByRole('button', { name: 'Clear Mandatory value' })).not.toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Clear Clearable value' }))

    // Cleared back to the resting state: label only, and the clear is gone with it.
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Clearable' })).toBeVisible()
    })
    await expect(canvas.queryByRole('button', { name: 'Clear Clearable value' })).not.toBeInTheDocument()
  },
}

/** `onClearButtonClick` receives the value being cleared, so a caller can undo or log it. */
export const ClearReportsTheClearedValue: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<string[]>(['Sales', 'Engineering'])
      const [cleared, setCleared] = useState<string>('')
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <FilterChip
            label="Department"
            value={value}
            selectionType="multiple"
            onClearButtonClick={({ value: previous }) => {
              setCleared(Array.isArray(previous) ? previous.join(', ') : previous)
              setValue([])
            }}
          />
          <p data-testid="cleared">{cleared ? `cleared: ${cleared}` : 'nothing cleared yet'}</p>
        </div>
      )
    }
    return <Demo />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Department value' }))
    await waitFor(() => {
      expect(canvas.getByTestId('cleared')).toHaveTextContent('cleared: Sales, Engineering')
    })
  },
}

export const Disabled: Story = {
  args: { value: 'Sales', isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Department: Sales' })).toBeDisabled()
    // A disabled chip offers no clear — it would be an enabled control inside a dead one.
    await expect(canvas.queryByRole('button', { name: /^Clear/ })).not.toBeInTheDocument()
  },
}

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <FilterChip {...args} label="Empty" />
      <FilterChip {...args} label="Single" value="Sales" />
      <FilterChip {...args} label="Multiple" value={['Sales', 'Engineering']} selectionType="multiple" />
      <FilterChip {...args} label="No clear" value="Sales" showClearButton={false} />
      <FilterChip {...args} label="Disabled" value="Sales" isDisabled />
    </div>
  ),
}

/** A long value truncates rather than stretching the chip across the filter bar. */
export const LongValueTruncates: Story = {
  args: { value: 'Supplier reference number for the Mumbai regional office' },
}

/** The chevron flips from any ancestor with `data-state="open"`, which Radix sets on the trigger —
 *  so the chip needs no `open` prop of its own. See Components/FilterDropdown for it in use.
 *  Asserted on `rotate`, not `transform`: Tailwind v4's rotate-* sets the standalone property. */
export const ChevronRespondsToOpenState: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <FilterChip {...args} label="Closed" />
      <div data-state="open">
        <FilterChip {...args} label="Open" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const chevronOf = (name: string) => canvas.getByRole('button', { name }).querySelector('svg')!
    await expect(getComputedStyle(chevronOf('Closed')).rotate).toBe('none')
    await expect(getComputedStyle(chevronOf('Open')).rotate).toBe('180deg')
  },
}
