import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { DateFilter } from './DateFilter'
import { FilterDropdown } from '@/components/FilterDropdown'
import type { DateRangeValue } from '@/lib/date'

// Layout follows Figma: AIA - Component Library, "Date range" (node 667:11575) — a preset dropdown,
// typed From/To fields over a single Sunday-first month, and month and year pickers beside Apply.
//
// Every story pins `today` to a fixed date. Anything deriving "today" from the clock would flake
// across midnight and between timezones, and preset assertions ("Last 30 days") would drift daily.
const TODAY = new Date(2026, 8, 15) // 15 Sep 2026
const PRESETS_LABEL = 'Show transactions for'

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

/** Transactions can't be dated in the future, so as in Figma the grid stops at today (`maxDate`). */
export const Default: Story = {
  args: { maxDate: TODAY },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Date' })).toBeVisible()
  },
}

/** Nothing is filtered until Apply. A range takes two clicks and a typed date is incomplete until
 *  its last digit, so committing live would filter on half-entered input. */
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

/** Clicking two days fills the From and To fields as well as the grid. */
export const PickDatesFromTheCalendar: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    // The grid labels days with their full date, so these are unambiguous.
    await userEvent.click(await screen.findByRole('button', { name: /September 10th, 2026/ }))
    await userEvent.click(await screen.findByRole('button', { name: /September 14th, 2026/ }))

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'From date, day' })).toHaveValue('10'))
    await expect(screen.getByRole('textbox', { name: 'To date, day' })).toHaveValue('14')

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('10 – 14 Sep 2026')
    })
  },
}

/** Focus moves forward as each segment fills, so a whole date is eight keystrokes. */
export const TypeARange: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('textbox', { name: 'From date, day' }))
    await userEvent.keyboard('01092026')
    await userEvent.click(screen.getByRole('textbox', { name: 'To date, day' }))
    await userEvent.keyboard('12092026')

    await expect(screen.getByRole('textbox', { name: 'From date, year' })).toHaveValue('2026')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent('1 – 12 Sep 2026')
    })
  },
}

/** A finished but impossible date is flagged rather than silently rolled over (31 Sep → 1 Oct). */
export const InvalidDateIsFlagged: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await choosePreset(userEvent, 'Last 7 days')
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled()

    // Replace the From day with 31 — September has 30.
    await userEvent.clear(screen.getByRole('textbox', { name: 'From date, day' }))
    await userEvent.keyboard('31')

    await waitFor(() => expect(screen.getByText('Not a valid date')).toBeVisible())
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  },
}

/** Two typed fields can put To before From, which the grid can't — so it's caught, and here the
 *  inverted range is the only thing standing between the user and Apply. */
export const ToBeforeFromBlocksApply: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await userEvent.click(await screen.findByRole('textbox', { name: 'From date, day' }))
    await userEvent.keyboard('20092026')
    await userEvent.click(screen.getByRole('textbox', { name: 'To date, day' }))
    await userEvent.keyboard('12092026')

    await waitFor(() => expect(screen.getByText('Must be on or after the From date')).toBeVisible())
    await expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  },
}

/** Choosing "Custom" in the dropdown puts the cursor in the From field, ready to type. */
export const CustomFocusesFromDate: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await choosePreset(userEvent, 'Last 7 days')
    await choosePreset(userEvent, 'Custom')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'From date, day' })).toHaveFocus())
  },
}

/** Reset restores the draft to `resetValue` (no date by default); Apply then commits it. */
export const ResetThenApply: Story = {
  args: { defaultValue: { from: new Date(2026, 7, 12), to: new Date(2026, 7, 19) } },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    const reset = await screen.findByRole('button', { name: 'Reset' })
    await expect(reset).toBeEnabled()

    await userEvent.click(reset)
    await expect(screen.getByRole('textbox', { name: 'From date, day' })).toHaveValue('')
    await expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Date' })).toHaveTextContent(/^Date$/)
    })
  },
}

/** The footer's month and year buttons jump straight to a month or year instead of paging. */
export const JumpToMonthAndYear: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))

    await userEvent.click(await screen.findByRole('button', { name: /Choose month/ }))
    await userEvent.click(screen.getByRole('button', { name: 'March' }))
    await expect(await screen.findByRole('button', { name: /March 10th, 2026/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Choose year/ }))
    await userEvent.click(screen.getByRole('button', { name: '2024' }))
    await expect(await screen.findByRole('button', { name: /March 10th, 2024/ })).toBeInTheDocument()
  },
}

/** Weeks start on Sunday by default, per Figma; pass `weekStartsOn={1}` for Monday. */
export const WeekStartsOnSunday: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    // react-day-picker renders weekday headers inside <thead aria-hidden="true">, so they carry no
    // `columnheader` role to query by — read the first header cell off the grid instead.
    const grid = await screen.findByRole('grid')
    await waitFor(() => {
      expect(grid.querySelector('thead th')).toHaveAttribute('aria-label', 'Sunday')
    })
  },
}

/** `minDate`/`maxDate` grey out days in the grid and reject them when typed. */
export const BoundedRange: Story = {
  args: { minDate: new Date(2026, 8, 1), maxDate: new Date(2026, 8, 20) },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Date' }))
    await waitFor(() => expect(screen.getByRole('button', { name: /September 15th, 2026/ })).toBeEnabled())
    await expect(screen.getByRole('button', { name: /September 25th, 2026/ })).toBeDisabled()

    await userEvent.click(screen.getByRole('textbox', { name: 'To date, day' }))
    await userEvent.keyboard('25092026')
    await waitFor(() => expect(screen.getByText('Must be on or before 20 Sep 2026')).toBeVisible())
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
