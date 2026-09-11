import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, waitFor } from 'storybook/test'
import { OTPInput } from './OTPInput'
import type { OTPInputSize } from './OTPInput'

// Reference: Razorpay Blade's OTPInput
// https://github.com/razorpay/blade/tree/master/packages/blade/src/components/Input/OTPInput
// Two deliberate departures from Blade — see OTPInput.tsx's header comment for why: digits-only
// input, and masked digits reveal briefly before hiding instead of masking immediately.

const meta = {
  title: 'Components/Input/OTPInput',
  component: OTPInput,
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta<typeof OTPInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'Verification code' },
  play: async ({ canvas, userEvent }) => {
    const boxes = canvas.getAllByRole('textbox')
    await expect(boxes).toHaveLength(6)

    // Auto-advance: typing a digit moves focus to the next box.
    await userEvent.click(boxes[0])
    await userEvent.keyboard('1')
    await expect(boxes[1]).toHaveFocus()

    // Backspace on an empty box clears and moves back to the previous one.
    await userEvent.keyboard('{Backspace}')
    await expect(boxes[0]).toHaveFocus()
    await expect(boxes[0]).toHaveValue('')
  },
}

export const With4Fields: Story = {
  args: { label: 'Verification code', length: 4 },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('textbox')).toHaveLength(4)
  },
}

export const WithHelpText: Story = {
  args: { label: 'Verification code', helpText: 'Sent to +1 (415) 555-0132.' },
}

export const WithoutLabel: Story = {
  args: { accessibilityLabel: 'Verification code' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/Verification code, digit 1 of 6/)).toBeVisible()
  },
}

export const WithMaskedInput: Story = {
  args: { label: 'Verification code', isMasked: true },
  play: async ({ canvas, userEvent }) => {
    const boxes = canvas.getAllByRole('textbox') as HTMLInputElement[]
    await userEvent.type(boxes[0], '5')
    // Reveals the digit briefly (matches native iOS/Android SMS-autofill behavior)...
    await expect(boxes[0]).toHaveAttribute('type', 'text')
    // ...then masks it after the reveal window.
    await waitFor(() => expect(boxes[0]).toHaveAttribute('type', 'password'), { timeout: 1000 })
  },
}

export const WithError: Story = {
  args: { label: 'Verification code', errorText: 'That code is incorrect.' },
  play: async ({ canvas }) => {
    const [firstBox] = canvas.getAllByRole('textbox')
    await expect(firstBox).toHaveAttribute('aria-invalid', 'true')
    await expect(getComputedStyle(firstBox).borderColor).toBe('rgb(253, 23, 23)') // --color-danger
  },
}

export const WithSuccess: Story = {
  args: { label: 'Verification code', defaultValue: '123456', successText: 'Verified.' },
  play: async ({ canvas }) => {
    const [firstBox] = canvas.getAllByRole('textbox')
    await expect(getComputedStyle(firstBox).borderColor).toBe('rgb(3, 160, 0)') // --color-success
  },
}

const SIZES: OTPInputSize[] = ['md', 'sm']

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {SIZES.map((size) => (
        <OTPInput key={size} label={size} size={size} length={4} />
      ))}
    </div>
  ),
}

export const Uncontrolled: Story = {
  args: { label: 'Verification code', onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const boxes = canvas.getAllByRole('textbox') as HTMLInputElement[]
    await userEvent.click(boxes[0])
    await userEvent.paste('4242')
    // Paste splits across boxes from the focused one, not truncated to a single character.
    await expect(boxes[0]).toHaveValue('4')
    await expect(boxes[1]).toHaveValue('2')
    await expect(boxes[2]).toHaveValue('4')
    await expect(boxes[3]).toHaveValue('2')
    await expect(args.onChange).toHaveBeenLastCalledWith('4242')
  },
}

function ControlledDemo() {
  const [value, setValue] = useState('123')
  return (
    <div>
      <OTPInput label="Verification code" length={4} value={value} onChange={setValue} />
      <button type="button" onClick={() => setValue('9999')} style={{ marginTop: 8 }}>
        Fill with 9999
      </button>
    </div>
  )
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvas, userEvent }) => {
    const boxes = canvas.getAllByRole('textbox') as HTMLInputElement[]
    await expect(boxes[0]).toHaveValue('1')
    await expect(boxes[2]).toHaveValue('3')
    await expect(boxes[3]).toHaveValue('')
    // The external "value" prop, not just internal state, drives what's shown.
    await userEvent.click(canvas.getByRole('button', { name: 'Fill with 9999' }))
    await expect(boxes[3]).toHaveValue('9')
  },
}

// Proves ref forwarding actually reaches the underlying DOM nodes (one per box), same bar as
// every other ref-forwarding component in this project.
function WithRefDemo() {
  const ref = useRef<(HTMLInputElement | null)[]>([])
  return (
    <div>
      <OTPInput ref={ref} label="Verification code" length={4} />
      <button type="button" onClick={() => ref.current[2]?.focus()} style={{ marginTop: 8 }}>
        Focus box 3
      </button>
    </div>
  )
}

export const Ref: Story = {
  render: () => <WithRefDemo />,
  play: async ({ canvas, userEvent }) => {
    const boxes = canvas.getAllByRole('textbox')
    await userEvent.click(canvas.getByRole('button', { name: 'Focus box 3' }))
    await expect(boxes[2]).toHaveFocus()
  },
}

export const WithLabelSuffixAndTrailing: Story = {
  args: {
    label: 'Verification code',
    labelSuffix: (
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }} title="Codes expire after 5 minutes">
        ⓘ
      </span>
    ),
    labelTrailing: (
      <button type="button" style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Resend code
      </button>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Resend code' })).toBeVisible()
  },
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <OTPInput label="Default" />
      <OTPInput label="4 digits" length={4} />
      <OTPInput label="Masked" isMasked defaultValue="12" />
      <OTPInput label="Error" errorText="Incorrect code." defaultValue="000000" />
      <OTPInput label="Success" successText="Verified." defaultValue="123456" />
      <OTPInput label="Disabled" isDisabled defaultValue="1234" />
    </div>
  ),
}
