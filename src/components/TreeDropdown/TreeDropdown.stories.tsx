import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { TreeDropdown, insertTreeItem } from './TreeDropdown'
import type { TreeDropdownItem } from './TreeDropdown'

// The nested-tree dropdown variant: single select, with items added inline — "Add root item" or
// "Add child to selected item" drops a named input into the tree, like creating a file in a folder.

const ITEMS: TreeDropdownItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'drafts', label: 'Drafts' },
      { id: 'published', label: 'Published' },
      { id: 'archive', label: 'Archive', children: [{ id: 'archive-2025', label: '2025' }] },
    ],
  },
  { id: 'projects', label: 'Projects', children: [{ id: 'project-a', label: 'Project A' }] },
  { id: 'library', label: 'Library', children: [{ id: 'templates', label: 'Templates' }] },
  { id: 'shared', label: 'Shared', disabled: true },
]

const meta = {
  title: 'Components/TreeDropdown',
  component: TreeDropdown,
  tags: ['ai-generated', 'autodocs'],
  args: { items: ITEMS, triggerLabel: 'Folder', accessibilityLabel: 'Choose folder' },
} satisfies Meta<typeof TreeDropdown>

export default meta
type Story = StoryObj<typeof meta>

/** Mirrors real usage: the parent owns both the tree and the selection. */
function Controlled(args: React.ComponentProps<typeof TreeDropdown>) {
  const [items, setItems] = useState(args.items)
  const [value, setValue] = useState<string | null>(args.defaultValue ?? null)
  return (
    <TreeDropdown
      {...args}
      items={items}
      value={value}
      onChange={setValue}
      onAddItem={(item, parentId) => setItems((previous) => insertTreeItem(previous, item, parentId))}
    />
  )
}

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toBeVisible()
  },
}

export const SelectedItemExpandsItsPath: Story = {
  args: { defaultValue: 'archive-2025' },
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: 2025')
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await expect(await screen.findByRole('treeitem', { name: '2025' })).toHaveAttribute('aria-selected', 'true')
  },
}

export const AddRootItem: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Add root item' }))

    // Focused and pre-filled with "New item" (selected), so typing replaces it.
    const input = await screen.findByLabelText('New item name')
    await expect(input).toHaveFocus()
    await userEvent.keyboard('Reports{Enter}')

    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Reports' })).toHaveAttribute('aria-selected', 'true'))
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Reports')
  },
}

export const AddChildToSelectedItem: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await expect(await screen.findByRole('button', { name: 'Add child to selected item' })).toBeDisabled()

    await userEvent.click(await screen.findByRole('treeitem', { name: 'Projects' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add child to selected item' }))
    await userEvent.keyboard('Project B{Enter}')

    // The parent is expanded and the new child is selected.
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Project B' })).toHaveAttribute('aria-level', '2'))
    await expect(screen.getByRole('treeitem', { name: 'Projects' })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Project B')
  },
}

export const EscapeCancelsAdd: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Add root item' }))
    await userEvent.keyboard('{Escape}')
    await expect(screen.queryByLabelText('New item name')).not.toBeInTheDocument()
    await expect(screen.queryByRole('treeitem', { name: 'New item' })).not.toBeInTheDocument()
  },
}

/** Arrow keys walk the visible rows; Right expands (then steps into), Left collapses (then steps out). */
export const KeyboardNavigation: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveFocus())

    await userEvent.keyboard('{ArrowRight}')
    await expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await expect(screen.getByRole('treeitem', { name: 'Drafts' })).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Drafts')

    await userEvent.keyboard('{ArrowLeft}')
    await expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveFocus()
  },
}
