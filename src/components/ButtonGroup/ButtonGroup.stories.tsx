import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor, within } from 'storybook/test'
import { Bold, ChevronDown, Italic, Underline } from 'lucide-react'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './ButtonGroup'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select } from '../Input/Select'
import { TextInput } from '../Input/TextInput'
import { Button } from '../Button/Button'
import type { ButtonSize, ButtonVariant } from '../Button/Button'

// Reference: Razorpay Blade's ButtonGroup
// https://blade.razorpay.com/?path=/docs/components-buttongroup--docs
// Adapted to our 6 variants (Blade has 3 variants x a color axis; we don't). See the plan for
// the divider-vs-border-collapse reasoning per variant.

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['ai-generated', 'autodocs'],
  // Every story below uses a custom `render`, but ButtonGroup.children is a required prop —
  // this default satisfies that for CSF3's typing without every story repeating it.
  args: { children: null },
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    // Segmented look: only the outer buttons get rounded corners, the middle one is square.
    const [day, week, month] = canvas.getAllByRole('button')
    await expect(getComputedStyle(day).borderTopLeftRadius).not.toBe('0px')
    await expect(getComputedStyle(week).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(month).borderTopRightRadius).not.toBe('0px')
  },
}

// Not a ButtonGroup prop (Blade doesn't have one either) — a composition pattern: the last
// segment is a Button that toggles a small menu, reusing the same interaction shape already
// established in Breadcrumb's sibling dropdown.
function SplitButtonWithDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <ButtonGroup>
        <Button>Save</Button>
        <Button
          trailingIcon={<ChevronDown size={16} />}
          accessibilityLabel="More save options"
          onClick={() => setOpen((value) => !value)}
        />
      </ButtonGroup>
      {open && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-4))',
            right: 0,
            listStyle: 'none',
            margin: 0,
            padding: 'var(--space-4)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-8)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            minWidth: 160,
          }}
        >
          {['Save as draft', 'Save and close'].map((label) => (
            <li key={label}>
              <button
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-8)',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-4)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-body-2-size)',
                  cursor: 'pointer',
                }}
                onClick={() => setOpen(false)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const WithDropdown: Story = {
  render: () => <SplitButtonWithDropdown />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.queryByText('Save as draft')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'More save options' }))
    await expect(await canvas.findByText('Save as draft')).toBeVisible()
  },
}

const ALL_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'link', 'link-secondary']
const ALL_SIZES: ButtonSize[] = ['md', 'sm']

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ALL_VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 100, fontSize: 12, color: 'var(--color-text-secondary)' }}>{variant}</span>
          <ButtonGroup variant={variant}>
            <Button>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    // Proves context inheritance, not just that the group renders: a Button with no explicit
    // `variant` prop, inside a `secondary` group, actually resolves to the secondary background.
    const secondaryButtons = canvas.getAllByRole('button', { name: 'One' })
    const insideSecondaryGroup = secondaryButtons[1] // second row is 'secondary'
    await expect(getComputedStyle(insideSecondaryGroup).backgroundColor).toBe('rgb(246, 247, 255)')
  },
}

export const AllVariantsWithLoading: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ALL_VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 100, fontSize: 12, color: 'var(--color-text-secondary)' }}>{variant}</span>
          <ButtonGroup variant={variant}>
            <Button>One</Button>
            <Button isLoading>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    // isLoading stays per-button even though variant/size are shared via context.
    const loadingButtons = canvas.getAllByRole('button', { name: 'Two' })
    const otherButtons = canvas.getAllByRole('button', { name: 'One' })
    await expect(loadingButtons[0]).toHaveAttribute('aria-busy', 'true')
    await expect(otherButtons[0]).not.toHaveAttribute('aria-busy')
  },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ALL_SIZES.map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 32, fontSize: 12, color: 'var(--color-text-secondary)' }}>{size}</span>
          <ButtonGroup size={size}>
            <Button>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </div>
      ))}
    </div>
  ),
}

export const IconsOnly: Story = {
  render: () => (
    <ButtonGroup variant="outline">
      <Button leadingIcon={<Bold size={16} />} accessibilityLabel="Bold" />
      <Button leadingIcon={<Italic size={16} />} accessibilityLabel="Italic" />
      <Button leadingIcon={<Underline size={16} />} accessibilityLabel="Underline" />
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Bold' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Italic' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Underline' })).toBeVisible()
  },
}

// A composed, realistic example — also where `isFullWidth` gets exercised (no dedicated story
// of its own, to keep the story count matching the reference exactly).
export const Showcase: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
        View
      </p>
      <ButtonGroup variant="outline" isFullWidth>
        <Button>List</Button>
        <Button>Grid</Button>
        <Button>Map</Button>
      </ButtonGroup>
    </div>
  ),
  play: async ({ canvas }) => {
    const [list] = canvas.getAllByRole('button')
    const group = list.parentElement as HTMLElement
    await expect(group).toHaveClass('w-full')
    // Real behavioral proof, not just the class: the group actually spans its container's width.
    await expect(group.getBoundingClientRect().width).toBe(group.parentElement!.getBoundingClientRect().width)
  },
}

// --- shadcn-style composition: orientation, separator, text, nesting, inputs, menus -------------
// Reference: https://ui.shadcn.com/docs/components/button-group

/** The group is a `role="group"`; name it so a screen reader announces what the buttons are for.
 *  Tab moves between the members like any other controls. */
export const Accessible: Story = {
  render: () => (
    <ButtonGroup variant="outline" accessibilityLabel="Text formatting">
      <Button leadingIcon={<Bold size={16} />} accessibilityLabel="Bold" />
      <Button leadingIcon={<Italic size={16} />} accessibilityLabel="Italic" />
      <Button leadingIcon={<Underline size={16} />} accessibilityLabel="Underline" />
    </ButtonGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('group', { name: 'Text formatting' })).toBeVisible()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveFocus()
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Italic' })).toHaveFocus()
  },
}

/** `orientation="vertical"` stacks the members and rounds the top and bottom instead. */
export const Orientation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      {(['outline', 'secondary', 'primary'] as const).map((variant) => (
        <ButtonGroup key={variant} variant={variant} orientation="vertical" accessibilityLabel={`${variant} stack`}>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('group', { name: 'outline stack' })
    await expect(getComputedStyle(group).flexDirection).toBe('column')
    const buttons = within(group)
    await expect(getComputedStyle(buttons.getByRole('button', { name: 'One' })).borderTopLeftRadius).not.toBe('0px')
    await expect(getComputedStyle(buttons.getByRole('button', { name: 'Two' })).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(buttons.getByRole('button', { name: 'Three' })).borderBottomLeftRadius).not.toBe('0px')
  },
}

/** An explicit divider between members. Outline members don't need one (they have borders); solid
 *  and tinted variants read better with it. */
export const Separator: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ButtonGroup variant="primary">
        <Button>Copy</Button>
        <ButtonGroupSeparator />
        <Button>Paste</Button>
      </ButtonGroup>
      <ButtonGroup variant="secondary">
        <Button>Copy</Button>
        <ButtonGroupSeparator />
        <Button>Paste</Button>
      </ButtonGroup>
      <ButtonGroup variant="secondary" orientation="vertical">
        <Button>Copy</Button>
        <ButtonGroupSeparator />
        <Button>Paste</Button>
      </ButtonGroup>
    </div>
  ),
  play: async ({ canvas }) => {
    const separators = canvas.getAllByRole('separator')
    await expect(separators[0]).toHaveAttribute('aria-orientation', 'vertical')
    // A vertical group divides with a horizontal line.
    await expect(separators[2]).toHaveAttribute('aria-orientation', 'horizontal')
    // The separator is the divider, so the member before it drops its own border.
    await expect(getComputedStyle(canvas.getAllByRole('button', { name: 'Copy' })[0]).borderRightWidth).toBe('0px')
  },
}

/** A split button: the main action plus a menu trigger, joined by a separator. */
export const Split: Story = {
  render: () => (
    <ButtonGroup variant="secondary" accessibilityLabel="Save">
      <Button>Save</Button>
      <ButtonGroupSeparator />
      <Button trailingIcon={<ChevronDown size={16} />} accessibilityLabel="More save options" />
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Save' })).toContainElement(canvas.getByRole('separator'))
  },
}

/** Groups can hold groups: each inner group joins its own members and the outer one only spaces
 *  them, inheriting variant and size from its parent. */
export const Nested: Story = {
  render: () => (
    <ButtonGroup variant="outline" accessibilityLabel="Editor toolbar">
      <ButtonGroup accessibilityLabel="Style">
        <Button leadingIcon={<Bold size={16} />} accessibilityLabel="Bold" />
        <Button leadingIcon={<Italic size={16} />} accessibilityLabel="Italic" />
      </ButtonGroup>
      <ButtonGroup accessibilityLabel="Alignment">
        <Button>Left</Button>
        <Button>Centre</Button>
        <Button>Right</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    const outer = canvas.getByRole('group', { name: 'Editor toolbar' })
    await expect(getComputedStyle(outer).columnGap).toBe('8px')
    // The outer group didn't square off the inner ones…
    await expect(getComputedStyle(canvas.getByRole('group', { name: 'Style' })).borderTopLeftRadius).toBe('0px')
    // …each inner group rounds its own outer corners, and inherits the outline variant.
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Bold' })).borderTopLeftRadius).not.toBe('0px')
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Italic' })).borderTopLeftRadius).toBe('0px')
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Left' })).borderTopWidth).toBe('1px')
  },
}

/** Non-interactive text as a member — a prefix, a unit, a count. With `htmlFor` it becomes the
 *  label of the neighbouring field. */
export const WithText: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 420 }}>
      <ButtonGroup variant="outline" isFullWidth accessibilityLabel="Website">
        <ButtonGroupText htmlFor="site">https://</ButtonGroupText>
        <TextInput id="site" accessibilityLabel="Website" placeholder="example.com" />
        <Button>Go</Button>
      </ButtonGroup>
    </div>
  ),
  play: async ({ canvas }) => {
    // The <label> names the input, so getByLabelText finds it through the text segment.
    await expect(canvas.getByLabelText('https://')).toBe(canvas.getByPlaceholderText('example.com'))
  },
}

/** A text field as a member: it fills the space the buttons leave, joins their corners, and its
 *  focus ring sits above its neighbours. */
export const WithInput: Story = {
  render: () => (
    <div style={{ width: 420 }}>
      <ButtonGroup variant="outline" isFullWidth accessibilityLabel="Search">
        <TextInput accessibilityLabel="Search term" placeholder="Search…" />
        <Button>Search</Button>
      </ButtonGroup>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText('Search…')
    const field = input.closest('[data-slot="field"]') as HTMLElement
    await expect(getComputedStyle(field).borderTopLeftRadius).not.toBe('0px')
    await expect(getComputedStyle(field).borderTopRightRadius).toBe('0px')
    await userEvent.click(input)
    await expect(getComputedStyle(field).zIndex).toBe('10')
  },
}

/** A select as a member. */
export const WithSelect: Story = {
  render: () => (
    <ButtonGroup variant="outline" accessibilityLabel="Currency amount">
      <Select
        accessibilityLabel="Currency"
        options={[
          { value: 'usd', label: 'USD' },
          { value: 'eur', label: 'EUR' },
        ]}
        defaultValue="usd"
      />
      <TextInput accessibilityLabel="Amount" placeholder="0.00" />
    </ButtonGroup>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Currency' })).toBeVisible()
    const field = canvas.getByPlaceholderText('0.00').closest('[data-slot="field"]') as HTMLElement
    await expect(getComputedStyle(field).borderTopLeftRadius).toBe('0px')
  },
}

/** A real menu on the trailing segment. The Button forwards Radix's trigger props, so the whole
 *  keyboard model comes with it: Enter/Space/ArrowDown open it, arrows move, Esc closes and returns
 *  focus to the trigger. */
export const WithDropdownMenu: Story = {
  render: () => (
    <ButtonGroup variant="secondary" accessibilityLabel="Save">
      <Button>Save</Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button trailingIcon={<ChevronDown size={16} />} accessibilityLabel="More save options" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Save as draft</DropdownMenuItem>
          <DropdownMenuItem>Save and close</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'More save options' })
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const item = await screen.findByRole('menuitem', { name: 'Save as draft' })
    // The panel fades in, so wait for it rather than asserting mid-animation.
    await waitFor(() => expect(item).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Save as draft' })).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  },
}

/** A popover on the trailing segment. */
export const WithPopover: Story = {
  render: () => (
    <ButtonGroup variant="outline" accessibilityLabel="Task">
      <Button>Follow up</Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button trailingIcon={<ChevronDown size={16} />} accessibilityLabel="Task options" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-[var(--space-12)]">
          <p style={{ margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-body-3-size)' }}>
            Pick when to be reminded.
          </p>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Task options' })
    await userEvent.click(trigger)
    const content = await screen.findByText('Pick when to be reminded.')
    await waitFor(() => expect(content).toBeVisible())
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  },
}
