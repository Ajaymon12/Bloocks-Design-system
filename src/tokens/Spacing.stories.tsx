import type { Meta, StoryObj } from '@storybook/react-vite'

function SpacingTokensPending() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: 24,
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>Spacing</h3>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Not yet populated — waiting on the Figma spacing scale.
      </p>
    </div>
  )
}

const meta = {
  title: 'Token/Spacing',
  component: SpacingTokensPending,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SpacingTokensPending>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {}
