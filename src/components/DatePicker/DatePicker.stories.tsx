import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { DatePicker } from './DatePicker'
import type { DateRangeValue } from '@/lib/date'

// `today` is pinned in every story — see DateFilter.stories.tsx for why.
const TODAY = new Date(2026, 8, 15) // 15 Sep 2026

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['ai-generated', 'autodocs'],
  args: { label: 'Invoice date', today: TODAY },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: React.ComponentProps<typeof DatePicker>) {
  const [value, setValue] = useState<DateRangeValue | undefined>(args.value)
  return <DatePicker {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Select date')).toBeVisible()
  },
}

/** Picking a single day closes the panel immediately — the choice is complete on one click. */
export const PickASingleDate: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Invoice date' }))
    await userEvent.click(await screen.findByRole('button', { name: /September 22nd, 2026/ }))

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Invoice date' })).toHaveTextContent('22 Sep 2026')
    })
  },
}

export const WithValue: Story = {
  args: { value: { from: new Date(2026, 7, 22) }, helpText: 'The date this invoice was raised.' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('22 Aug 2026')).toBeVisible()
  },
}

/** `mode="range"` reuses the same field with the preset sidebar attached. */
export const RangeMode: Story = {
  args: { mode: 'range', label: 'Reporting period', value: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('12 – 19 Aug 2026')).toBeVisible()
  },
}

export const WithClearButton: Story = {
  args: { value: { from: new Date(2026, 7, 22) }, showClearButton: true },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear date' }))
    await waitFor(() => expect(canvas.getByText('Select date')).toBeVisible())
  },
}

export const ErrorState: Story = {
  args: { errorText: 'Pick a date to continue.', necessityIndicator: 'required' },
}

export const Disabled: Story = {
  args: { value: { from: new Date(2026, 7, 22) }, isDisabled: true },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DatePicker {...args} size="sm" label="Small" value={{ from: new Date(2026, 7, 22) }} />
      <DatePicker {...args} size="md" label="Medium (default)" value={{ from: new Date(2026, 7, 22) }} />
    </div>
  ),
}

/** Days outside min/max are greyed out and unclickable. */
export const BoundedDates: Story = {
  args: { minDate: new Date(2026, 8, 10), maxDate: new Date(2026, 8, 20) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Invoice date' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /September 15th, 2026/ })).toBeEnabled())
    await expect(screen.getByRole('button', { name: /September 2nd, 2026/ })).toBeDisabled()
  },
}
