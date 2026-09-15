import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { CreditCard, Mail } from 'lucide-react'
import { TextInput } from './TextInput'
import type { BaseInputSize } from '../BaseInput/BaseInput'

// Foundation for this whole family: src/components/Input/BaseInput/. Every concrete input
// (TextInput here, TextArea/PasswordInput/etc. to follow) is a thin specialization of it.
// Reference: Razorpay Blade's TextInput
// https://github.com/razorpay/blade/tree/master/packages/blade/src/components/Input/TextInput
// (BaseInput: .../Input/BaseInput). No Figma source for this family yet (rate-limited) — built
// from src/styles/tokens.css. Deliberately not carried over from Blade: tagged-input mode,
// leading/trailing dropdowns, and `format` masking — none of our planned 8 input components
// need them; the type stays open to adding them later if a real need comes up.

const meta = {
  title: 'Components/Input/TextInput',
  component: TextInput,
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'Full name', placeholder: 'Ada Lovelace' },
}

// Figma's focus treatment (AIA - Component Library, Input): the primary border inside a 2px
// blue-200 ring (a box-shadow), not just a border color flip.
export const Focused: Story = {
  args: { label: 'Focus me', placeholder: 'Click or tab in' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Focus me')
    const wrapper = input.parentElement as HTMLElement
    // Resting state already has a faint shadow-xs, so compare before/after rather than to 'none' —
    // focusing should layer the colored ring on top, producing a visibly different box-shadow.
    const restingShadow = getComputedStyle(wrapper).boxShadow
    await userEvent.click(input)
    // The border/box-shadow change animates over 150ms (see BaseInput.css's transition) — poll
    // instead of reading immediately, which races the transition and catches an interpolated
    // in-between color rather than the final one.
    await waitFor(() => {
      expect(getComputedStyle(wrapper).boxShadow).not.toBe(restingShadow)
      expect(getComputedStyle(wrapper).borderColor).toBe('rgb(49, 70, 176)') // --color-primary, #3146b0
    })
  },
}

export const WithHelpText: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    helpText: "We'll never share your email.",
  },
}

export const ErrorState: Story = {
  args: {
    label: 'Email',
    defaultValue: 'not-an-email',
    errorText: 'Enter a valid email address.',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Email')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    // Real proof, not just that errorText renders: the wrapper border actually turns Figma's
    // error red, and the message itself is shown and linked, so it isn't conveyed by color alone.
    const wrapper = input.parentElement as HTMLElement
    await expect(getComputedStyle(wrapper).borderColor).toBe('rgb(210, 19, 19)') // --color-input-error, #d21313
    await expect(canvas.getByText('Enter a valid email address.')).toBeVisible()
    await expect(input).toHaveAccessibleDescription('Enter a valid email address.')
  },
}

export const SuccessState: Story = {
  args: {
    label: 'Username',
    defaultValue: 'ada_lovelace',
    successText: 'Username is available.',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Username')
    const wrapper = input.parentElement as HTMLElement
    await expect(getComputedStyle(wrapper).borderColor).toBe('rgb(3, 160, 0)') // --color-success, #03a000
    await expect(canvas.getByText('Username is available.')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { label: 'Referral code', defaultValue: 'LOCKED123', isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Referral code')).toBeDisabled()
  },
}

export const Required: Story = {
  args: { label: 'Company name', necessityIndicator: 'required', isRequired: true },
  play: async ({ canvas }) => {
    // The label's accessible name includes the necessity indicator's own text, so match loosely.
    const input = canvas.getByLabelText(/Company name/)
    await expect(input).toHaveAttribute('aria-required', 'true')
    await expect(canvas.getByText('*')).toBeVisible()
  },
}

export const WithLeadingIcon: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', leadingIcon: <Mail size={16} /> },
}

// Controlled, since the counter needs to react to real typing.
function MaxCharactersDemo() {
  const [value, setValue] = useState('Hello')
  return (
    <TextInput
      label="Tweet"
      maxCharacters={20}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

export const WithMaxCharacters: Story = {
  render: () => <MaxCharactersDemo />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('5/20')).toBeVisible()
    await userEvent.type(canvas.getByLabelText('Tweet'), '!')
    await expect(canvas.getByText('6/20')).toBeVisible()
  },
}

const SIZES: BaseInputSize[] = ['md', 'sm']

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      {SIZES.map((size) => (
        <TextInput key={size} label={size} size={size} placeholder={`Size ${size}`} />
      ))}
    </div>
  ),
}

export const WithTrailingIcon: Story = {
  args: { label: 'Card number', placeholder: '4242 4242 4242 4242', trailingIcon: <CreditCard size={16} /> },
}

export const TypeNumber: Story = {
  args: { label: 'Age', type: 'number', placeholder: '18' },
}

export const WithoutLabel: Story = {
  args: { accessibilityLabel: 'Search', placeholder: 'Search…' },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Search')).toBeVisible()
  },
}

export const Uncontrolled: Story = {
  args: { label: 'Nickname', defaultValue: 'Ada' },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Nickname') as HTMLInputElement
    await userEvent.type(input, '!')
    await expect(input).toHaveValue('Ada!')
  },
}

function ControlledDemo() {
  const [value, setValue] = useState('')
  return <TextInput label="Controlled" value={value} onChange={(event) => setValue(event.target.value)} />
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Controlled')
    await userEvent.type(input, 'Hi')
    await expect(input).toHaveValue('Hi')
  },
}

// Proves ref forwarding actually reaches the underlying <input>, same bar as Button's WithRef.
function WithRefDemo() {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <TextInput ref={ref} label="Focus me via ref" />
      <button type="button" onClick={() => ref.current?.focus()} style={{ marginTop: 8 }}>
        Focus the input
      </button>
    </div>
  )
}

export const WithRef: Story = {
  render: () => <WithRefDemo />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Focus me via ref')
    await userEvent.click(canvas.getByRole('button', { name: 'Focus the input' }))
    await expect(input).toHaveFocus()
  },
}

function ShowClearButtonDemo() {
  const [value, setValue] = useState('Clear me')
  return (
    <TextInput
      label="Filter"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      showClearButton
    />
  )
}

export const ShowClearButton: Story = {
  render: () => <ShowClearButtonDemo />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('Filter') as HTMLInputElement
    await expect(input.value).toBe('Clear me')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear input' }))
    await expect(input.value).toBe('')
  },
}

export const Loading: Story = {
  args: { label: 'Checking availability', defaultValue: 'ada_lovelace', isLoading: true },
  play: async ({ canvas }) => {
    // Loading takes priority over the trailing slot — no clear button while it's spinning.
    await expect(canvas.queryByRole('button', { name: 'Clear input' })).toBeNull()
  },
}

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 320 }}>
      <TextInput label="Email" leadingIcon={<Mail size={16} />} necessityIndicator="required" isRequired />
      <TextInput label="Card number" trailingIcon={<CreditCard size={16} />} placeholder="4242 4242 4242 4242" />
      <TextInput label="Bio" maxCharacters={80} defaultValue="Design systems enthusiast." helpText="Shown on your profile." />
      <TextInput label="Promo code" errorText="This code has expired." defaultValue="SAVE10" />
    </div>
  ),
}

export const WithLabelHint: Story = {
  args: {
    label: 'API key',
    labelHint: 'Found under Settings → Developer → API keys.',
    placeholder: 'sk_live_...',
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Found under Settings/ })
    await expect(canvas.queryByRole('tooltip')).toBeNull()
    // Click focuses the button (Chromium default), which is what reveals the tooltip.
    await userEvent.click(trigger)
    await expect(canvas.getByRole('tooltip')).toBeVisible()
  },
}
