import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Bold, ChevronDown, Italic, Underline } from 'lucide-react'
import { ButtonGroup } from './ButtonGroup'
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
