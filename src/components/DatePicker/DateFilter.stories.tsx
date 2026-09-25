import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { DateFilter } from './DateFilter'
import { FilterDropdown } from '@/components/FilterDropdown'
import type { DateRangeValue } from '@/lib/date'

// Layout follows Figma: AIA - Component Library, "Date range" (node 667:11575) — a preset dropdown
// over two Sunday-first months side by side, each under its own boxed header, with Reset and Apply
// beneath. The day states (selected, range start/middle/end, hover, disabled, empty) are node
// 664:11225.
//
// Every story pins `today` to a fixed date. Anything deriving "today" from the clock would flake
// across midnight and between timezones, and preset assertions ("Last 30 days") would drift daily.
const TODAY = new Date(2026, 8, 15) // 15 Sep 2026
const PRESETS_LABEL = 'Show results for'

const meta = {
  title: 'Components/DateFilter',
  component: DateFilter,
  tags: ['ai-generated', 'autodocs'],
  args: { label: 'Date', today: TODAY, presetsLabel: PRESETS_LABEL },
} satisfies Meta<typeof DateFilter>

export default meta
type Story = StoryObj<typeof meta>

function Controlled(args: React.ComponentProps<typeof DateFilter>) {
  const [value, setValue] = useState<DateRangeValue | undefined>(args.defaultValue)
  return <DateFilter {...args} value={value} onChange={setValue} />
}

async function choosePreset(userEvent: { selectOptions: (element: Element, value: string) => Promise<void> }, label: string) {
  await userEvent.selectOptions(await screen.findByRole('combobox', { name: PRESETS_LABEL }), label)
}

/** Nothing can be dated in the future, so the grid stops at today (`maxDate`). */
export const Default: Story = {
  args: { maxDate: TODAY },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Date' })).toBeVisible()
  },
}

/** Nothing is filtered until Apply. A range takes two clicks, so committing live would filter on a
 *  half-picked range. */
export const ChangesWaitForApply: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    const apply = await screen.findByRole('button', { name: 'Apply' })
    await expect(apply).toBeDisabled()

    await choosePreset(userEvent, 'Last 7 days')
    // Picked, not applied: the chip hasn't changed yet.
    await expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent(/^Date$/)
    await expect(apply).toBeEnabled()

    await userEvent.click(apply)
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('Date: Last 7 days')
    })
  },
}

/** Picking a preset is the common path — the chip then shows the preset's name, not two dates. */
export const PresetShowsItsName: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await choosePreset(userEvent, 'Last 30 days')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

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
    await choosePreset(userEvent, 'Last 7 days')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

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

/** The chip's × clears straight away — no panel, no Apply. */
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

/** A range panel shows two months side by side, each under its own boxed header. */
export const TwoMonthsSideBySide: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await expect(await screen.findByRole('grid', { name: 'September 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
    // Days from the neighbouring month are left empty, so a date never appears in both grids.
    await expect(screen.getAllByRole('button', { name: /September 30th, 2026/ })).toHaveLength(1)
  },
}

/** Nothing can be dated after `maxDate`, so the pair slides back to end on today's month — the right
 *  month holds today — and there's nowhere further forward to go. */
export const StopsAtMaxDate: Story = {
  args: { maxDate: TODAY },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await expect(await screen.findByRole('grid', { name: 'August 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument()
    await expect(screen.queryByRole('grid', { name: 'October 2026' })).not.toBeInTheDocument()

    await expect(screen.getByRole('button', { name: 'Month after September 2026' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: /September 15th, 2026/ })).toBeEnabled()
    await expect(screen.getByRole('button', { name: /September 16th, 2026/ })).toBeDisabled()
  },
}

/** Each month has its own chevrons: move the right-hand month on without touching the left, so a
 *  start and an end can sit months apart. */
export const MonthsNavigateIndependently: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Month after October 2026' }))

    await expect(await screen.findByRole('grid', { name: 'November 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Month before September 2026' }))
    await expect(await screen.findByRole('grid', { name: 'August 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument()
  },
}

/** The two months stay in order and never repeat: moving one onto its partner pushes the partner
 *  along, in either direction. */
export const MonthsNeverShowTheSameMonth: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))

    // Left forward onto October: October stays on the left and November takes the right.
    await userEvent.click(await screen.findByRole('button', { name: 'Month after September 2026' }))
    await expect(await screen.findByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument()
    await expect(screen.queryByRole('grid', { name: 'September 2026' })).not.toBeInTheDocument()

    // Right back onto October: it pushes the left month back to September.
    await userEvent.click(screen.getByRole('button', { name: 'Month before November 2026' }))
    await expect(await screen.findByRole('grid', { name: 'September 2026' })).toBeInTheDocument()
    await expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument()
    await expect(screen.queryByRole('grid', { name: 'November 2026' })).not.toBeInTheDocument()
  },
}

/** Two clicks make a range, and nothing is filtered until Apply. */
export const PickDatesFromTheCalendar: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    // The grid labels days with their full date, so these are unambiguous.
    await userEvent.click(await screen.findByRole('button', { name: /September 10th, 2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: /September 14th, 2026/ }))
    await expect(screen.getByRole('button', { name: /September 12th, 2026, selected/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('10 – 14 Sep 2026')
    })
  },
}

/** The start and the end can sit in different months — one click in each grid. */
export const RangeAcrossTwoMonths: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('button', { name: /September 26th, 2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: /October 8th, 2026/ }))

    // The band runs unbroken across the boundary.
    await expect(screen.getByRole('button', { name: /September 30th, 2026, selected/ })).toBeInTheDocument()
    await expect(screen.getByRole('button', { name: /October 3rd, 2026, selected/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('26 Sep – 8 Oct 2026')
    })
  },
}

/** One click is a whole one-day range, so Apply is ready straight away; a second click extends it. */
export const OneClickPicksASingleDay: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await expect(await screen.findByRole('button', { name: 'Apply' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /September 10th, 2026/ }))
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('10 Sep 2026')
    })
    await expect(canvas.getByRole('button', { name: 'Date' })).not.toHaveTextContent('–')
  },
}

/** Choosing "Custom" keeps the days already picked and just relabels the dropdown. */
export const CustomKeepsThePickedDays: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await choosePreset(userEvent, 'Last 7 days')
    await expect(screen.getByRole('combobox', { name: PRESETS_LABEL })).toHaveValue('Last 7 days')

    await choosePreset(userEvent, 'Custom')
    await expect(screen.getByRole('combobox', { name: PRESETS_LABEL })).toHaveValue('Custom')
    await expect(screen.getByRole('button', { name: /September 12th, 2026, selected/ })).toBeInTheDocument()
  },
}

/** Reset restores the draft to `resetValue` (no date by default); Apply then commits it. */
export const ResetThenApply: Story = {
  args: { defaultValue: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await expect(await screen.findByRole('button', { name: /August 12th, 2026, selected/ })).toBeInTheDocument()
    const reset = screen.getByRole('button', { name: 'Reset' })
    await expect(reset).toBeEnabled()

    await userEvent.click(reset)
    await expect(screen.getByRole('button', { name: /August 12th, 2026$/ })).toBeInTheDocument()
    await expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent(/^Date$/)
    })
  },
}

/** Weeks start on Sunday by default, per Figma; pass `weekStartsOn={1}` for Monday. */
export const WeekStartsOnSunday: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    // react-day-picker renders weekday headers inside <thead aria-hidden="true">, so they carry no
    // `columnheader` role to query by — read the first header cell off each grid instead.
    const grids = await screen.findAllByRole('grid')
    await expect(grids).toHaveLength(2)
    await waitFor(() => {
      for (const grid of grids) expect(grid.querySelector('thead th')).toHaveAttribute('aria-label', 'Sunday')
    })
  },
}

/** `minDate`/`maxDate` grey out days in the grid and stop the month chevrons at the edge. */
export const BoundedRange: Story = {
  args: { minDate: new Date(2026, 8, 1), maxDate: new Date(2026, 8, 20) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /September 15th, 2026/ })).toBeEnabled())
    await expect(screen.getByRole('button', { name: /September 25th, 2026/ })).toBeDisabled()
    await expect(screen.getByRole('button', { name: /October 1st, 2026/ })).toBeDisabled()

    await expect(screen.getByRole('button', { name: 'Month before September 2026' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Month after October 2026' })).toBeDisabled()
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
