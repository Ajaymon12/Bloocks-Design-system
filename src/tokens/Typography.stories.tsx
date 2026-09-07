import type { Meta, StoryObj } from '@storybook/react-vite'

function TypographyTokensPending() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: 24,
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>Typography</h3>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Not yet populated — waiting on the Figma type scale (font family, sizes, weights, line
        heights).
      </p>
    </div>
  )
}

const meta = {
  title: 'Token/Typography',
  component: TypographyTokensPending,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TypographyTokensPending>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {}
