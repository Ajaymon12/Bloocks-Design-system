import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { CalendarDays, ChartColumn, Folder, Inbox, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { Tooltip, TooltipProvider } from './Tooltip'

// Figma: OpenSource shadcn/ui kit, Tooltip
// https://www.figma.com/design/SOI5iogKWwEDwx12jqGeWF/OpenSource-shadcn-ui---kit-for-Figma--Community-?node-id=13-896
// Story copy is generic placeholder text, not the wording on the Figma frames.

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['ai-generated', 'autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Add to list', children: <Button variant="secondary">Hover</Button> },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// Figma "Tooltip / Button": the hint sits above the trigger.
export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Hover' }))
    const body = within(document.body)
    await waitFor(() => expect(body.getAllByText('Add to list')[0]).toBeVisible())
  },
}

// Keyboard users get it too, and Escape closes it.
export const OnFocus: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Hover' })).toHaveFocus()
    const body = within(document.body)
    await waitFor(() => expect(body.getAllByText('Add to list')[0]).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('tooltip')).not.toBeInTheDocument())
  },
}

export const Open: Story = {
  args: { isOpen: true },
  decorators: [(Story) => <div style={{ padding: '48px 96px 16px' }}><Story /></div>],
}

export const Sides: Story = {
  render: () => (
    <div className="flex gap-[200px] px-[120px] py-16">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} label={`On the ${side}`} side={side} isOpen>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
  args: { label: '' },
}

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'Inbox', icon: Inbox },
  { label: 'Documents', icon: Folder },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Reports', icon: ChartColumn },
]

// Figma "Tooltip / Navigation": an icon-only rail names each item beside it. Only the hovered item
// shows one; the story opens the third so the frame is visible without a pointer.
export const BesideNavigation: Story = {
  render: () => (
    <TooltipProvider>
      <nav aria-label="Rail" className="flex w-16 flex-col gap-1 rounded-md border border-border bg-background p-2">
        {NAV_ITEMS.map(({ label, icon: Icon }, index) => (
          <Tooltip key={label} label={label} side="right" isOpen={index === 2 ? true : undefined}>
            <button
              type="button"
              aria-label={label}
              className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border-0 text-foreground hover:bg-[var(--color-surface-subtle)] ${index === 2 ? 'bg-[var(--color-surface-subtle)]' : 'bg-transparent'}`}
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  ),
  args: { label: '' },
  decorators: [(Story) => <div style={{ padding: '16px 160px 16px 16px' }}><Story /></div>],
}

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Hover' }))
    await new Promise((resolve) => setTimeout(resolve, 400))
    await expect(within(document.body).queryByRole('tooltip')).not.toBeInTheDocument()
  },
}
