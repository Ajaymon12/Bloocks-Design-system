import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { Button } from '@/components/Button/Button'
import { ExampleTopNav } from '@/components/TopNav/TopNav.fixtures'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from './Drawer'
import { HelpCenterDrawer, RecordDetailsDrawer } from './Drawer.fixtures'

// Figma: slide-over panels — help panel (node 21746:48989) and detail panels (node 10672:53263)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21746-48989
// Modelled on Blade's Drawer: https://blade.razorpay.com/?path=/docs/components-drawer--docs
// All story content is generic mock data.

const meta: Meta<typeof Drawer> = {
  title: 'Components/Drawer',
  component: Drawer,
  tags: ['ai-generated', 'autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Drawer>

const body = within(document.body)

function BasicExample() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="p-[var(--space-24)]">
      <Button onClick={() => setIsOpen(true)}>Open drawer</Button>
      <Drawer isOpen={isOpen} onDismiss={() => setIsOpen(false)}>
        <DrawerHeader title="Drawer title" subtitle="Supporting text that explains this drawer." />
        <DrawerBody>
          <p className="m-0 text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-foreground">
            Drawer content goes here. The body scrolls while the header and footer stay put.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="link-secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Confirm</Button>
        </DrawerFooter>
      </Drawer>
    </div>
  )
}

/** A medium drawer with a header, body and footer. The close button, Escape and an outside click all dismiss it. */
export const Basic: Story = {
  render: () => <BasicExample />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open drawer' })
    await userEvent.click(trigger)
    const drawer = await body.findByRole('dialog', { name: 'Drawer title' })
    await waitFor(() => expect(drawer.getBoundingClientRect().width).toBe(445))

    await userEvent.click(body.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    // Focus goes back to whatever opened the drawer.
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  },
}

function HelpCenterExample() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="flex h-[750px] flex-col bg-background">
      <ExampleTopNav onHelpClick={() => setIsOpen((open) => !open)} />
      <main className="p-[var(--space-24)]">
        <h1 className="m-0 text-[length:var(--text-h5-size)] leading-[var(--text-h5-line-height)] font-normal text-foreground">
          Projects
        </h1>
        <p className="text-[length:var(--text-body-3-size)] text-muted-foreground">Press Help in the top bar.</p>
      </main>
      <HelpCenterDrawer isOpen={isOpen} onDismiss={() => setIsOpen(false)} topOffset={50} />
    </div>
  )
}

/**
 * The narrow help panel opens below the TopNav (`topOffset={50}`). Pick a topic to drill in; the
 * back button returns to the overview.
 */
export const HelpCenter: Story = {
  render: () => <HelpCenterExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Help' }))
    const drawer = await body.findByRole('dialog', { name: 'Getting started' })
    await waitFor(() => expect(drawer.getBoundingClientRect().top).toBe(50))
    // The current topic can't be picked again.
    await expect(body.getByRole('button', { name: 'Getting started' })).toBeDisabled()

    await userEvent.click(body.getByRole('button', { name: 'Reports' }))
    await expect(await body.findByRole('dialog', { name: 'Reports' })).toBeInTheDocument()
    await expect(body.getByText('2 videos')).toBeInTheDocument()

    await userEvent.click(body.getByRole('button', { name: 'Back' }))
    await expect(await body.findByText('Other topics')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

function RecordDetailsExample() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="p-[var(--space-24)]">
      <Button onClick={() => setIsOpen(true)}>View record</Button>
      <RecordDetailsDrawer isOpen={isOpen} onDismiss={() => setIsOpen(false)} />
    </div>
  )
}

/**
 * The wide drawer for viewing and editing a record: a summary header with a field picker, section
 * cards, editable line items, and footer actions.
 */
export const RecordDetails: Story = {
  render: () => <RecordDetailsExample />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'View record' }))
    const drawer = await body.findByRole('dialog', { name: 'Record details' })
    await waitFor(() => expect(drawer.getBoundingClientRect().width).toBe(928))
    await expect(body.getByRole('region', { name: 'Line items' })).toBeInTheDocument()

    // Turning on an optional field from the header menu adds it to the form.
    await expect(body.queryByLabelText('Tags')).not.toBeInTheDocument()
    await userEvent.click(body.getByRole('button', { name: /Fields/ }))
    await userEvent.click(await body.findByRole('menuitemcheckbox', { name: 'Tags' }))
    await expect(await body.findByLabelText('Tags')).toBeInTheDocument()

    // Line items can be added and removed.
    await expect(body.getAllByRole('button', { name: /^Remove row/ })).toHaveLength(2)
    await userEvent.click(body.getByRole('button', { name: 'Add item' }))
    await expect(body.getAllByRole('button', { name: /^Remove row/ })).toHaveLength(3)
    await userEvent.click(body.getByRole('button', { name: 'Remove row 3' }))
    await expect(body.getAllByRole('button', { name: /^Remove row/ })).toHaveLength(2)

    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}
