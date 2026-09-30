import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'
import { TreeDropdown, insertTreeItem } from './TreeDropdown'
import type { TreeDropdownItem } from './TreeDropdown'

// Figma: AIA - Component Library, Dropdowns → "Dropdown single select" (tree variant)
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=710-14084
// Single select, with items added inline: the "Add item" footer adds at the top level, and the "+"
// that appears on a hovered row adds inside it — a named input drops into the tree, like creating a
// file in a folder.

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

// Five levels deep, for checking indentation and truncation at the deepest level.
const DEEP_ITEMS: TreeDropdownItem[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    children: [
      {
        id: 'team-a',
        label: 'Team A',
        children: [
          {
            id: 'quarter-1',
            label: 'Quarter 1',
            children: [
              {
                id: 'month-1',
                label: 'Month 1',
                children: [
                  { id: 'week-1', label: 'Week 1' },
                  { id: 'week-2', label: 'Week 2' },
                  { id: 'week-3-long', label: 'Week 3 with a much longer name' },
                ],
              },
              { id: 'month-2', label: 'Month 2', children: [{ id: 'month-2-week-1', label: 'Week 1' }] },
            ],
          },
          { id: 'quarter-2', label: 'Quarter 2', children: [{ id: 'quarter-2-month-1', label: 'Month 1' }] },
        ],
      },
      { id: 'team-b', label: 'Team B', children: [{ id: 'team-b-quarter-1', label: 'Quarter 1' }] },
    ],
  },
  { id: 'personal', label: 'Personal', children: [{ id: 'notes', label: 'Notes' }] },
  { id: 'archived', label: 'Archived', disabled: true },
]

/** Select-only: without `onAddItem` there's no "Add item" footer and no "+" on rows. The value opens
 *  on a fifth-level item, so the whole path is expanded. */
export const WithoutAddFiveLevels: Story = {
  args: { items: DEEP_ITEMS, defaultValue: 'week-2' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(args.defaultValue ?? null)
    return <TreeDropdown {...args} value={value} onChange={setValue} />
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await expect(await screen.findByRole('treeitem', { name: 'Week 2' })).toHaveAttribute('aria-level', '5')
    await expect(screen.queryByRole('button', { name: 'Add item' })).not.toBeInTheDocument()
    await expect(screen.queryByRole('button', { name: /Add item inside/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('treeitem', { name: 'Week 1' }))
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Week 1')
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
    await userEvent.click(await screen.findByRole('button', { name: 'Add item' }))

    // Focused and pre-filled with "New item" (selected), so typing replaces it.
    const input = await screen.findByLabelText('New item name')
    await expect(input).toHaveFocus()
    await userEvent.keyboard('Reports{Enter}')

    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Reports' })).toHaveAttribute('aria-selected', 'true'))
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Reports')
  },
}

export const AddItemInsideARow: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))

    // The row's "+" fades in on hover.
    await userEvent.hover(await screen.findByRole('treeitem', { name: 'Projects' }))
    await userEvent.click(screen.getByRole('button', { name: 'Add item inside Projects' }))
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
    await userEvent.click(await screen.findByRole('button', { name: 'Add item' }))
    await userEvent.keyboard('{Escape}')
    await expect(screen.queryByLabelText('New item name')).not.toBeInTheDocument()
    await expect(screen.queryByRole('treeitem', { name: 'New item' })).not.toBeInTheDocument()
  },
}

/** Search matches at any depth: parents on the way to a match open, the match is bolded, and
 *  Enter picks the first match. */
export const SearchFindsNestedItems: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    const search = await screen.findByPlaceholderText('Search…')
    await expect(search).toHaveFocus()
    await userEvent.type(search, '2025')

    await expect(await screen.findByRole('treeitem', { name: '2025' })).toHaveAttribute('aria-level', '3')
    await expect(screen.getByRole('treeitem', { name: 'Archive' })).toHaveAttribute('aria-expanded', 'true')
    await expect(screen.queryByRole('treeitem', { name: 'Projects' })).not.toBeInTheDocument()

    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: 2025')
  },
}

export const SearchNoResults: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    await userEvent.type(await screen.findByPlaceholderText('Search…'), 'zzz')
    await expect(await screen.findByText(/No matches for/)).toBeVisible()
  },
}

/** Focus starts in search; ArrowDown enters the tree. Arrow keys walk the visible rows; Right expands
 *  (then steps into), Left collapses (then steps out); Up from the first row returns to search. */
export const KeyboardNavigation: Story = {
  render: (args) => <Controlled {...args} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Choose folder' }))
    const search = await screen.findByPlaceholderText('Search…')
    await waitFor(() => expect(search).toHaveFocus())

    await userEvent.keyboard('{ArrowDown}')
    await expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await expect(screen.getByRole('treeitem', { name: 'Drafts' })).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('button', { name: 'Choose folder' })).toHaveTextContent('Folder: Drafts')

    await userEvent.keyboard('{ArrowLeft}')
    await expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    await expect(search).toHaveFocus()
  },
}
