import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { DateFilter } from './DateFilter'
import { FilterDropdown } from '@/components/FilterDropdown'
import type { DateRangeValue } from '@/lib/date'

// Every story pins `today` to a fixed date. Anything deriving "today" from the clock would flake
// across midnight and between timezones, and preset assertions ("Last 30 days") would drift daily.
const TODAY = new Date(2026, 8, 15) // 15 Sep 2026

const meta = {
  title: 'Components/DateFilter',
  component: DateFilter,
  tags: ['ai-generated', 'autodocs'],
  args: { label: 'Date', today: TODAY },
} satisfies Meta<typeof DateFilter>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: React.ComponentProps<typeof DateFilter>) {
  const [value, setValue] = useState<DateRangeValue | undefined>(args.defaultValue)
  return <DateFilter {...args} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Date' })).toBeVisible()
  },
}

/** Picking a preset is the common path — the chip then shows the preset's name, not two dates. */
export const PresetShowsItsName: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Last 30 days' }))

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('Date: Last 30 days')
    })
  },
}

/** With `displayFormat="default"` the resolved dates are always shown instead of the label. */
export const DefaultFormatShowsDates: Story = {
  args: { displayFormat: 'default' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Last 7 days' }))

    // 15 Sep 2026 minus 6 days, collapsed to a shared month and year.
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('9 – 15 Sep 2026')
    })
  },
}

/** A hand-picked range matches no preset, so the chip falls back to the formatted dates. */
export const CustomRange: Story = {
  args: { defaultValue: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('12 – 19 Aug 2026')
  },
}

/** A range spanning a month boundary keeps both months; across a year, both years. */
export const RangeFormatting: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <DateFilter {...args} label="Same month" defaultValue={{ from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) }} />
      <DateFilter {...args} label="Same year" defaultValue={{ from: new Date(2026, 6, 28), to: new Date(2026, 7, 4) }} />
      <DateFilter {...args} label="Across years" defaultValue={{ from: new Date(2025, 11, 22), to: new Date(2026, 0, 9) }} />
    </div>
  ),
}

export const ClearResetsTheRange: Story = {
  args: { defaultValue: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Clear Date value' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('Date')
    })
    await expect(canvas.queryByRole('button', { name: 'Clear Date value' })).not.toBeInTheDocument()
  },
}

/** Clicking two days in the calendar builds a range. */
export const PickDatesFromTheCalendar: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    // The grid labels days with their full date, so these are unambiguous.
    await userEvent.click(await screen.findByRole('button', { name: /September 10th, 2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: /September 14th, 2026/ }))

    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('10 – 14 Sep 2026')
    })
  },
}

/** `minDate`/`maxDate` grey out everything outside the allowed window. */
export const BoundedRange: Story = {
  args: { minDate: new Date(2026, 8, 1), maxDate: new Date(2026, 8, 30) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /September 15th, 2026/ })).toBeEnabled())
    await expect(screen.getByRole('button', { name: /October 5th, 2026/ })).toBeDisabled()
  },
}

export const Disabled: Story = {
  args: { defaultValue: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) }, isDisabled: true },
}

/** The point of building it on FilterChip: it sits in a filter bar beside FilterDropdown and
 *  behaves identically — same trigger, same inline clear. */
export const InAFilterBar: Story = {
  render: (args) => {
    function Bar() {
      const [date, setDate] = useState<DateRangeValue | undefined>({
        from: new Date(2026, 7, 17),
        to: new Date(2026, 8, 15),
      })
      const [departments, setDepartments] = useState<string[]>(['sales'])
      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <DateFilter {...args} label="Date" value={date} onChange={setDate} />
          <FilterDropdown
            triggerLabel="Department"
            accessibilityLabel="Filter by department"
            groups={[
              {
                label: 'Department',
                options: [
                  { value: 'sales', label: 'Sales' },
                  { value: 'engineering', label: 'Engineering' },
                ],
              },
            ]}
            value={departments}
            onChange={setDepartments}
          />
        </div>
      )
    }
    return <Bar />
  },
}
