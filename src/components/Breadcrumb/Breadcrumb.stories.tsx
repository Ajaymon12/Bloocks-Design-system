import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Breadcrumb } from './Breadcrumb'

const FOCUS_RING_COLOR = 'rgb(49, 70, 176)' // --color-primary, #3146b0

// Figma: AIA - Component Library, Breadcrumb
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=616-74493
// Note: separator was updated from the chevron-right icon to "/" — Figma is being updated to match.

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['ai-generated', 'autodocs'],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

// A short, everyday trail — no collapsing, no back button needed.
export const Basic: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ],
    onNavigate: () => {},
  },
  play: async ({ canvas, userEvent }) => {
    // Default separator is "/" (per the updated Figma spec).
    await expect(canvas.getAllByText('/').length).toBeGreaterThan(0)

    // Keyboard focus is a global rule (src/styles/tokens.css), not something Breadcrumb defines
    // itself — this proves it actually reaches a different component's plain <a> elements too.
    const home = canvas.getByRole('link', { name: 'Home' })
    await userEvent.tab()
    await expect(document.activeElement).toBe(home)
    await expect(getComputedStyle(home).outlineStyle).toBe('solid')
    await expect(getComputedStyle(home).outlineColor).toBe(FOCUS_RING_COLOR)
  },
}

// The separator can be overridden per-instance — useful while the Figma spec settles or for
// one-off pages that need something other than the "/" default.
export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Settings', href: '/settings' },
      { label: 'Profile' },
    ],
    onNavigate: () => {},
    separator: '›',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('›').length).toBeGreaterThan(0)
    await expect(canvas.queryByText('/')).toBeNull()
  },
}

// Long trails collapse behind an ellipsis, keeping a back button for quick escape.
export const WithEllipsis: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Components', href: '/components' },
      { label: 'Navigation', href: '/components/navigation' },
      { label: 'Patterns', href: '/components/navigation/patterns' },
      { label: 'Breadcrumb' },
    ],
    onBack: () => {},
    onNavigate: () => {},
  },
  play: async ({ canvas, userEvent }) => {
    // Proves the trail actually collapsed instead of rendering all 5 items flat.
    await expect(canvas.getByLabelText('Show hidden crumbs')).toBeVisible()
    await expect(canvas.getByText('Breadcrumb')).toHaveAttribute('aria-current', 'page')
    await userEvent.click(canvas.getByRole('link', { name: 'Home' }))
  },
}

// Compact two-level trail with a sibling-page dropdown next to the current page.
// Hovering the "current page + chevron" trigger shows a blue pill (Figma node 622:78198).
export const Dropdown: Story = {
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Breadcrumb' }],
    onBack: () => {},
    siblings: [{ label: 'Accordion' }, { label: 'Alert' }, { label: 'Button' }],
  },
  play: async ({ canvas, userEvent }) => {
    const current = canvas.getByText('Breadcrumb', { selector: '[data-current]' })
    const trigger = current.parentElement as HTMLElement

    // Real CSS :hover isn't triggerable via synthetic events even in real-browser Vitest mode
    // (Chromium only updates :hover from genuine pointer input), so we can only verify the
    // hover styling *hook* is wired up — that this trigger carries the conditional hover classes
    // applied only when a dropdown trigger is present. The visual result is confirmed manually.
    await expect(trigger.className).toContain('hover:bg-accent')

    await expect(canvas.queryByText('Accordion')).toBeNull()
    await userEvent.click(canvas.getByLabelText('Show sibling pages'))
    await expect(await canvas.findByText('Accordion')).toBeVisible()
  },
}

// A single item collapses to a plain page heading — no trail chrome needed at the root.
export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home' }],
  },
}

// How to wire this into a router: pass `onNavigate` to intercept clicks (call your
// router's navigate function instead of following `href`), or omit it entirely and
// let real <a> tags drive a full-page navigation / your router's Link interception.
export const RouterUsage: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Invoices', href: '/invoices' },
      { label: 'INV-1042' },
    ],
    onNavigate: (item) => {
      // e.g. with React Router: navigate(item.href!)
      // e.g. with Next.js: router.push(item.href!)
      console.log('navigate to', item.href)
    },
  },
}
