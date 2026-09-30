import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Undo2 } from 'lucide-react'
import { Button } from '@/components/Button/Button'
import { Toast } from './Toast'
import { ToastProvider } from './Toaster'
import { useToast } from './ToastContext'

// Figma: AIA - Component Library, Toast
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=826-2619
// Story copy is generic placeholder text, not the wording on the Figma frame.

const meta = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['ai-generated', 'autodocs'],
  parameters: { layout: 'centered' },
  args: { title: 'Changes saved' },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: { status: 'success', title: 'Export complete' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Export complete')
  },
}

export const Error: Story = {
  args: { status: 'error', title: "Couldn't save changes" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible()
  },
}

export const Warning: Story = {
  args: { status: 'warning', title: 'Sync paused' },
}

export const Loading: Story = {
  args: { status: 'loading', title: 'Export in progress' },
}

export const WithDescription: Story = {
  args: {
    status: 'warning',
    title: 'Import finished with issues',
    description: '16 rows were imported; 1 row could not be processed.',
  },
}

export const ErrorWithDescription: Story = {
  args: {
    status: 'error',
    title: "Items weren't removed.",
    description: 'They may have been changed by someone else, or your access changed.',
  },
}

export const WithAction: Story = {
  args: {
    status: 'success',
    title: '14 items removed.',
    description: 'They were moved out of the list.',
    action: { label: 'Undo', icon: <Undo2 size={12} />, onClick: fn() },
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }))
    await expect(args.action?.onClick).toHaveBeenCalledOnce()
  },
}

export const Dismissible: Story = {
  args: { status: 'loading', title: 'Export in progress', onDismiss: fn() },
  decorators: [(Story) => <div style={{ padding: 16 }}><Story /></div>],
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
    await expect(args.onDismiss).toHaveBeenCalledOnce()
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4 rounded-md bg-[#e6e6e6] p-6">
      <Toast status="success" title="Export complete" />
      <Toast status="error" title="Couldn't save changes" />
      <Toast status="warning" title="Sync paused" />
      <Toast status="loading" title="Export in progress" />
      <Toast
        status="success"
        title="14 items removed."
        description="They were moved out of the list."
        action={{ label: 'Undo', icon: <Undo2 size={12} />, onClick: () => {} }}
      />
      <Toast status="error" title="Items weren't removed." description="They may have been changed by someone else." />
    </div>
  ),
  args: { title: '' },
}

// The provider stacks toasts at the bottom of the page and dismisses them on a timer. A loading
// toast waits until it is updated, which is how a long task reports back.
function Demo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast.show({ status: 'success', title: 'Changes saved' })}>
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.show({
            status: 'error',
            title: "Couldn't save changes",
            description: 'Check your connection and try again.',
            isDismissible: true,
          })
        }
      >
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          const id = toast.show({ status: 'loading', title: 'Export in progress' })
          window.setTimeout(() => toast.update(id, { status: 'success', title: 'Export complete' }), 1500)
        }}
      >
        Loading, then done
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.show({
            status: 'success',
            title: '3 items removed.',
            description: 'They were moved out of the list.',
            action: { label: 'Undo', icon: <Undo2 size={12} />, onClick: () => {} },
            duration: 8000,
          })
        }
      >
        With undo
      </Button>
    </div>
  )
}

export const Provider: Story = {
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
  args: { title: '' },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Success' }))
    // The toast animates in, so wait for it rather than asserting mid-fade.
    const saved = await body.findByText('Changes saved')
    await waitFor(() => expect(saved).toBeVisible())
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'With undo' }))
    await userEvent.click(await body.findByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(body.queryByText('3 items removed.')).not.toBeInTheDocument())
  },
}
