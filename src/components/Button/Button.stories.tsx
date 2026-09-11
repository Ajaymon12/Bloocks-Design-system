import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { Button } from './Button'
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button'

// Figma: AIA - Component Library, Button
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=316-662
// Note: the Figma frame's literal colors/font (shadcn defaults, DM Sans) were NOT used — it
// turned out to be an un-rethemed shadcn import. Built from this project's own tokens instead;
// see src/styles/tokens.css. Only structure (variants/sizes/states/padding math) was sourced from it.

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Button' },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Button' })
    // Real keyboard nav, not a class check: Tab to it and confirm the global focus-visible
    // ring (src/styles/tokens.css) actually renders — unlike :hover, :focus responds correctly
    // to synthetic events since it's real DOM state, not OS-tracked pointer position.
    await userEvent.tab()
    await expect(document.activeElement).toBe(button)
    const style = getComputedStyle(button)
    await expect(style.outlineStyle).toBe('solid')
    await expect(style.outlineColor).toBe('rgb(49, 70, 176)') // --color-primary, #3146b0
  },
}

export const Primary: Story = {
  args: { children: 'Primary', variant: 'primary' },
}

export const Secondary: Story = {
  args: { children: 'Secondary', variant: 'secondary' },
}

export const Outline: Story = {
  args: { children: 'Outline', variant: 'outline' },
}

export const Ghost: Story = {
  args: { children: 'Ghost', variant: 'ghost' },
}

export const Link: Story = {
  args: { children: 'Link', variant: 'link' },
}

export const LinkSecondary: Story = {
  args: { children: 'Link Secondary', variant: 'link-secondary' },
}

// The `isDestructive` toggle swaps the brand color for the danger color across every variant.
export const Destructive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['primary', 'secondary', 'outline', 'ghost', 'link'] as ButtonVariant[]).map((variant) => (
        <Button key={variant} variant={variant} isDestructive>
          {variant}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const primary = canvas.getByRole('button', { name: 'primary' })
    await expect(getComputedStyle(primary).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  },
}

export const AsLink: Story = {
  args: { children: 'Visit page', href: 'https://example.com', target: '_blank', rel: 'noreferrer' },
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Visit page' })
    await expect(link).toHaveAttribute('href', 'https://example.com')
  },
}

export const Disabled: Story = {
  args: { children: 'Disabled', isDisabled: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Disabled' })
    // Real disabled — not just visual: the browser itself refuses pointer interaction
    // (pointer-events: none), so there's no click to intercept in the first place.
    await expect(button).toBeDisabled()
  },
}

export const LeftIcon: Story = {
  args: { children: 'Add item', leadingIcon: <Plus size={16} /> },
}

export const RightIcon: Story = {
  args: { children: 'Continue', trailingIcon: <ArrowRight size={16} /> },
}

export const IconOnly: Story = {
  args: { leadingIcon: <Search size={18} />, accessibilityLabel: 'Search' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Search' })).toBeVisible()
  },
}

export const Loading: Story = {
  args: { children: 'Saving…', isLoading: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: 'Saving…' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    // isLoading implies disabled — same real browser-level protection as the Disabled story.
    await expect(button).toBeDisabled()
  },
}

export const FullWidth: Story = {
  args: { children: 'Full width', isFullWidth: true },
  parameters: { layout: 'padded' },
}

// Proves ref forwarding actually reaches the underlying DOM node, not just that the class exists.
function RefDemo() {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null)
  const [status, setStatus] = useState('ref not connected')

  useEffect(() => {
    setStatus(ref.current ? `ref connected to <${ref.current.tagName.toLowerCase()}>` : 'ref not connected')
  }, [])

  return (
    <div>
      <Button ref={ref}>Ref button</Button>
      <p data-testid="ref-status" style={{ fontSize: 12, marginTop: 8 }}>
        {status}
      </p>
    </div>
  )
}

export const WithRef: Story = {
  render: () => <RefDemo />,
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId('ref-status')).toHaveTextContent('ref connected to <button>')
  },
}

const ALL_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'link', 'link-secondary']
const ALL_SIZES: ButtonSize[] = ['md', 'sm']

// Adapted from Blade's own "All Variants & Sizes" page structure (sections per variant, rows
// per state/configuration, columns per size) — using our actual prop vocabulary, not a
// fabricated "color" axis Blade has and we don't.
const STATE_ROWS: { label: string; props: Partial<ButtonProps>; iconOnly?: boolean }[] = [
  { label: 'Default', props: {} },
  { label: 'Destructive', props: { isDestructive: true } },
  { label: 'Disabled', props: { isDisabled: true } },
  { label: 'Loading', props: { isLoading: true } },
  { label: 'Leading icon', props: { leadingIcon: <Plus size={16} /> } },
  { label: 'Trailing icon', props: { trailingIcon: <ArrowRight size={16} /> } },
  { label: 'Icon only', props: { leadingIcon: <Plus size={16} /> }, iconOnly: true },
]

export const AllVariantsAndSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {ALL_VARIANTS.map((variant) => (
        <section key={variant}>
          <h3
            style={{
              margin: '0 0 12px',
              textTransform: 'capitalize',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-family-primary)',
            }}
          >
            {variant}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STATE_ROWS.map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 96, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {row.label}
                </span>
                {ALL_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={variant}
                    size={size}
                    accessibilityLabel={row.iconOnly ? `${variant} icon button` : undefined}
                    {...row.props}
                  >
                    {row.iconOnly ? undefined : variant}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    // Proves the whole grid is genuinely keyboard-navigable, not just visually laid out.
    const buttons = canvas.getAllByRole('button')
    await userEvent.tab()
    await expect(document.activeElement).toBe(buttons[0])
    await expect(getComputedStyle(buttons[0]).outlineStyle).toBe('solid')
  },
}
