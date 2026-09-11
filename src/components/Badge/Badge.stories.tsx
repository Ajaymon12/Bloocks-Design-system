import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { TriangleAlert } from 'lucide-react'
import { Badge } from './Badge'
import type { BadgeColor, BadgeSize } from './Badge'

// Figma: AIA - Component Library, Badge
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=603-1883
// Colors/spacing/type sourced from the "Status" badge frame's dev-mode CSS export (sm size only —
// md/lg below are extrapolated up this project's own type scale, not Figma-confirmed).
// Color naming (positive/negative/notice/information/neutral/primary) deliberately mirrors
// Blade's Badge API rather than this project's own success/danger/warning vocabulary — see
// tokens.css's --color-badge-* tokens. Each story below labels its badge with its own color name.

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Neutral' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Neutral')).toBeVisible()
  },
}

// The exact Figma-specified combination: sm size, notice (formerly "warning") color.
export const SmallSize: Story = {
  args: { children: 'Notice', size: 'sm', color: 'notice' },
  play: async ({ canvas }) => {
    const badge = canvas.getByText('Notice')
    await expect(getComputedStyle(badge.parentElement!).backgroundColor).toBe('rgb(255, 239, 201)') // amber-100
  },
}

export const MediumSize: Story = {
  args: { children: 'Notice', size: 'md', color: 'notice' },
}

export const LargeSize: Story = {
  args: { children: 'Notice', size: 'lg', color: 'notice' },
}

export const WithIcon: Story = {
  args: { children: 'Notice', color: 'notice', icon: <TriangleAlert size={10} /> },
}

const ALL_COLORS: BadgeColor[] = ['neutral', 'primary', 'positive', 'negative', 'notice', 'information']
const ALL_SIZES: BadgeSize[] = ['sm', 'md', 'lg']
const ICON_SIZE: Record<BadgeSize, number> = { sm: 10, md: 12, lg: 14 }

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export const AllVariants: Story = {
  args: { children: 'Positive' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {ALL_COLORS.map((color) => (
        <section key={color}>
          <h3
            style={{
              margin: '0 0 12px',
              textTransform: 'capitalize',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-family-primary)',
            }}
          >
            {color}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'No icon', icon: undefined },
              { label: 'With icon', icon: true },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 96, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {row.label}
                </span>
                {ALL_SIZES.map((size) => (
                  <Badge
                    key={size}
                    color={color}
                    size={size}
                    icon={row.icon ? <TriangleAlert size={ICON_SIZE[size]} /> : undefined}
                  >
                    {capitalize(color)}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
}

export const TextTruncationTooltip: Story = {
  args: {
    children: 'This is a much longer status label than usually expected',
    maxWidth: 120,
  },
  play: async ({ canvas }) => {
    const label = canvas.getByText('This is a much longer status label than usually expected')
    // Real truncation, not just a class name: the text's full layout width must exceed its
    // clipped box for the ellipsis to actually be doing anything.
    await expect(label.scrollWidth).toBeGreaterThan(label.offsetWidth)
    await expect(label).toHaveAttribute('title', 'This is a much longer status label than usually expected')
  },
}
