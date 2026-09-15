import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Select } from './Select'
import type { SelectOption, SelectSize } from './Select'

// Reference: a Figma-exported "Type or Select" field the user shared, showing label+info-icon,
// a dropdown chevron, and a clear button across many states. Built as a native <select> (not a
// custom combobox — see Select.tsx for why) using the same tokens and JS-tracked focus-ring
// pattern as BaseInput/TextInput.

const FRAMEWORKS: SelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
  { value: 'solid', label: 'Solid', disabled: true },
]

const meta = {
  title: 'Components/Input/Select',
  component: Select,
  tags: ['ai-generated', 'autodocs'],
  args: { options: FRAMEWORKS },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'Framework', defaultValue: 'react' },
}

export const WithPlaceholder: Story = {
  args: { label: 'Framework', placeholder: 'Type or Select' },
  play: async ({ canvas }) => {
    // The placeholder <option> is deliberately `hidden` (so it never appears in the dropdown
    // list itself) — that's what makes it a placeholder. Assert the real signal: no real value
    // is selected, and the select's own muted-placeholder styling is applied.
    const select = canvas.getByLabelText('Framework') as HTMLSelectElement
    await expect(select.value).toBe('')
    await expect(select.className).toContain('text-muted-foreground')
  },
}

export const WithLabelHint: Story = {
  args: {
    label: 'Framework',
    placeholder: 'Type or Select',
    labelHint: 'Pick the framework this project is built with.',
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Pick the framework/ })
    await expect(canvas.queryByRole('tooltip')).toBeNull()
    await userEvent.click(trigger)
    await expect(canvas.getByRole('tooltip')).toBeVisible()
  },
}

export const ErrorState: Story = {
  args: { label: 'Framework', placeholder: 'Type or Select', errorText: 'Please select a framework.' },
  play: async ({ canvas }) => {
    const select = canvas.getByLabelText('Framework')
    await expect(select).toHaveAttribute('aria-invalid', 'true')
    const wrapper = select.parentElement as HTMLElement
    await expect(getComputedStyle(wrapper).borderColor).toBe('rgb(210, 19, 19)') // --color-input-error, #d21313
  },
}

export const SuccessState: Story = {
  args: { label: 'Framework', defaultValue: 'react', successText: 'Looks good.' },
  play: async ({ canvas }) => {
    const select = canvas.getByLabelText('Framework')
    const wrapper = select.parentElement as HTMLElement
    await expect(getComputedStyle(wrapper).borderColor).toBe('rgb(3, 160, 0)') // --color-success
  },
}

export const Disabled: Story = {
  args: { label: 'Framework', defaultValue: 'react', isDisabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Framework')).toBeDisabled()
  },
}

export const Required: Story = {
  args: { label: 'Framework', placeholder: 'Type or Select', necessityIndicator: 'required', isRequired: true },
  play: async ({ canvas }) => {
    const select = canvas.getByLabelText(/Framework/)
    await expect(select).toHaveAttribute('aria-required', 'true')
    await expect(canvas.getByText('*')).toBeVisible()
  },
}

function ShowClearButtonDemo() {
  const [value, setValue] = useState('react')
  return (
    <Select
      label="Framework"
      options={FRAMEWORKS}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      showClearButton
    />
  )
}

export const ShowClearButton: Story = {
  render: () => <ShowClearButtonDemo />,
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByLabelText('Framework') as HTMLSelectElement
    await expect(select.value).toBe('react')
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }))
    await expect(select.value).toBe('')
  },
}

const SIZES: SelectSize[] = ['md', 'sm']

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 }}>
      {SIZES.map((size) => (
        <Select key={size} label={size} options={FRAMEWORKS} size={size} defaultValue="react" />
      ))}
    </div>
  ),
}

// Proves ref forwarding actually reaches the underlying <select>, same bar as Button/TextInput.
function WithRefDemo() {
  const ref = useRef<HTMLSelectElement>(null)
  return (
    <div>
      <Select ref={ref} label="Focus me via ref" options={FRAMEWORKS} placeholder="Type or Select" />
      <button type="button" onClick={() => ref.current?.focus()} style={{ marginTop: 8 }}>
        Focus the select
      </button>
    </div>
  )
}

export const WithRef: Story = {
  render: () => <WithRefDemo />,
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByLabelText('Focus me via ref')
    await userEvent.click(canvas.getByRole('button', { name: 'Focus the select' }))
    await expect(select).toHaveFocus()
  },
}
