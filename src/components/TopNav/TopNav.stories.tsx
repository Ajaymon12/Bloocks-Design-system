import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { TopNav, TopNavActions, TopNavAvatar, TopNavBrand, TopNavContent } from './TopNav'
import { ExampleTopNav, PlaceholderLogo } from './TopNav.fixtures'

// Figma: Top and sidebar → TopBar (node 21706:63943)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21706-63943
// Modelled on Blade's TopNav: https://blade.razorpay.com/?path=/docs/components-topnav--docs
// TopNav is layout only. The workspace and profile menus are ui/dropdown-menu, composed by the
// caller. All story content is generic placeholder text.

const meta: Meta<typeof TopNav> = {
  title: 'Components/TopNav',
  component: TopNav,
  tags: ['ai-generated', 'autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof TopNav>

/** Brand, workspace switcher, a text button, an icon button and the profile avatar. */
export const Default: Story = {
  render: () => <ExampleTopNav />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('banner')).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Home' })).toBeVisible()

    // Switching workspace updates the trigger.
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: /Acme/ }))
    await userEvent.click(await body.findByRole('menuitem', { name: /Globex/ }))
    await expect(canvas.getByRole('button', { name: /Globex/ })).toBeVisible()
  },
}

/** The profile avatar opens an account menu. */
export const ProfileMenu: Story = {
  render: () => <ExampleTopNav />,
  play: async ({ canvas, userEvent }) => {
    const avatar = canvas.getByRole('button', { name: 'Profile menu' })
    await userEvent.click(avatar)
    const body = within(document.body)
    // The menu fades in from opacity 0, so wait out the entrance before checking visibility.
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'Sign out' })).toBeVisible())
    await expect(body.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument()
    await expect(avatar).toHaveAttribute('data-state', 'open')
  },
}

/** The switcher's chevron flips while its menu is open. */
export const OrgSwitcherOpen: Story = {
  render: () => <ExampleTopNav />,
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /Acme/ })
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('data-state', 'open')
  },
}

/** The slots are independent. Actions stay on the right without a TopNavContent. */
export const Minimal: Story = {
  render: () => (
    <TopNav>
      <TopNavBrand>
        <PlaceholderLogo />
      </TopNavBrand>
      <TopNavActions>
        <TopNavAvatar name="Jane Doe" />
      </TopNavActions>
    </TopNav>
  ),
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole('button', { name: 'Jane Doe' })
    await expect(avatar).toHaveTextContent('J')
    const header = canvas.getByRole('banner').getBoundingClientRect()
    // Right padding is 24px (Figma), so the avatar ends 24px from the edge.
    await expect(Math.round(header.right - avatar.getBoundingClientRect().right)).toBe(24)
  },
}

/** TopNavContent centres anything in the middle, e.g. a search field. */
export const WithContent: Story = {
  render: () => (
    <TopNav>
      <TopNavBrand>
        <PlaceholderLogo />
      </TopNavBrand>
      <TopNavContent>
        <span className="text-[length:var(--text-label-2-size)] text-[var(--color-topnav-text)]">Centre content</span>
      </TopNavContent>
      <TopNavActions>
        <TopNavAvatar name="Jane Doe" />
      </TopNavActions>
    </TopNav>
  ),
}
