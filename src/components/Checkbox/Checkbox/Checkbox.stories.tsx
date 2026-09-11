import { Fragment, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn } from 'storybook/test'
import { Checkbox } from './Checkbox'
import type { CheckboxProps, CheckboxSize } from './Checkbox'

// Reference: Razorpay Blade's Checkbox
// https://blade.razorpay.com/?path=/docs/components-checkbox-checkbox--docs
// See Checkbox.tsx's header comment for the deliberate departures from Blade (onChange
// signature, validationState's 'success' state, JS-tracked visual state, the added `lg` size).

const meta = {
  title: 'Components/Checkbox/Checkbox',
  component: Checkbox,
  tags: ['ai-generated', 'autodocs'],
  args: { children: 'Accept terms and conditions' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { isChecked: true, onChange: fn() },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toBeChecked()
  },
}

export const DefaultChecked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox).toBeChecked()
    // Uncontrolled: clicking it actually toggles, unlike Checked (which stays pinned by props).
    await userEvent.click(checkbox)
    await expect(checkbox).not.toBeChecked()
  },
}

export const HelpText: Story = {
  args: { helpText: 'You can change this later in Settings.' },
}

export const ErrorText: Story = {
  args: { errorText: 'You must accept the terms to continue.' },
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    // Real proof, not just that errorText renders: the visible box's border actually turns red.
    const box = checkbox.nextElementSibling as HTMLElement
    await expect(getComputedStyle(box).borderColor).toBe('rgb(253, 23, 23)') // --color-danger
  },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  play: async ({ canvas }) => {
    // The DOM .indeterminate property specifically — there's no HTML attribute for it, so this
    // is the only real way to prove it actually applied (not just that the prop was passed).
    const checkbox = canvas.getByRole('checkbox') as HTMLInputElement
    await expect(checkbox.indeterminate).toBe(true)
  },
}

function ControlledAndUncontrolledDemo() {
  const [checked, setChecked] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox isChecked={checked} onChange={(e) => setChecked(e.target.checked)}>
        Controlled
      </Checkbox>
      <Checkbox defaultChecked>Uncontrolled</Checkbox>
    </div>
  )
}

export const ControlledAndUncontrolled: Story = {
  render: () => <ControlledAndUncontrolledDemo />,
  play: async ({ canvas, userEvent }) => {
    const [controlled, uncontrolled] = canvas.getAllByRole('checkbox')
    await expect(controlled).not.toBeChecked()
    await userEvent.click(controlled)
    await expect(controlled).toBeChecked()
    await expect(uncontrolled).toBeChecked() // unaffected — it manages its own state
  },
}

// Proves ref forwarding actually reaches the real (hidden) <input>, same bar as every other
// ref-forwarding component in this project.
function CheckboxRefDemo() {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <Checkbox ref={ref}>Focus me via ref</Checkbox>
      <button type="button" onClick={() => ref.current?.focus()} style={{ marginTop: 8, display: 'block' }}>
        Focus the checkbox
      </button>
    </div>
  )
}

export const CheckboxRef: Story = {
  render: () => <CheckboxRefDemo />,
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox')
    await userEvent.click(canvas.getByRole('button', { name: 'Focus the checkbox' }))
    await expect(checkbox).toHaveFocus()
  },
}

const SIZES: CheckboxSize[] = ['sm', 'md', 'lg']
const SIZE_LABEL: Record<CheckboxSize, string> = { sm: 'Size Small', md: 'Size Medium', lg: 'Size Large' }

// Mirrors Blade's Checkbox Showcase (size sections, each a Default/Help Text/Disabled/Error ×
// Unchecked/Checked/Indeterminate matrix): https://blade.razorpay.com/?path=/story/components-checkbox-checkbox--showcase
const SHOWCASE_COLUMNS: { id: string; label: string; props: Partial<CheckboxProps> }[] = [
  { id: 'unchecked', label: 'Unchecked', props: {} },
  { id: 'checked', label: 'Checked', props: { isChecked: true } },
  { id: 'indeterminate', label: 'Indeterminate', props: { isIndeterminate: true } },
]

const SHOWCASE_ROWS: { id: string; label: string; props: Partial<CheckboxProps> }[] = [
  { id: 'default', label: 'Default', props: {} },
  { id: 'helptext', label: 'Help Text', props: { helpText: 'Help text' } },
  { id: 'disabled', label: 'Disabled', props: { isDisabled: true } },
  { id: 'error', label: 'Error', props: { errorText: 'Error text' } },
]

export const Showcase: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {SIZES.map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontWeight: 600 }}>{SIZE_LABEL[size]}</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px repeat(3, minmax(160px, 1fr))',
              rowGap: 16,
              columnGap: 16,
              alignItems: 'center',
              justifyItems: 'center',
            }}
          >
            <div />
            {SHOWCASE_COLUMNS.map((column) => (
              <span key={column.id} style={{ fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                {column.label}
              </span>
            ))}
            {SHOWCASE_ROWS.map((row) => (
              <Fragment key={row.id}>
                <span style={{ fontSize: 13, fontWeight: 500, justifySelf: 'end' }}>{row.label}</span>
                {SHOWCASE_COLUMNS.map((column) => (
                  <Checkbox key={`${row.id}-${column.id}`} size={size} {...row.props} {...column.props}>
                    Option
                  </Checkbox>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}
