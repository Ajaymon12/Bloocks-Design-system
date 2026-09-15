import { useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { BookOpen, CalendarDays, ChartColumn, Folder, Inbox, LayoutGrid, Settings } from 'lucide-react'
import { ExampleTopNav } from '@/components/TopNav/TopNav.fixtures'
import type { SideNavIconComponent, SideNavProps } from './SideNav'
import { SideNav, SideNavBody, SideNavLevel, SideNavLink } from './SideNav'

// Figma: Top and sidebar → SideBar (node 21786:46818) and SideBar - Mini (node 21786:53962)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21786-46818
// Modelled on Blade's SideNav: https://blade.razorpay.com/?path=/docs/components-sidenav--docs
// Active state belongs to the caller. These stories keep it in local state; in an app, derive it
// from the current route. All labels and icons are generic placeholders.

type NavItem = { title: string; icon: SideNavIconComponent; children?: string[] }

const NAV_ITEMS: NavItem[] = [
  { title: 'Overview', icon: LayoutGrid },
  { title: 'Inbox', icon: Inbox },
  { title: 'Projects', icon: Folder },
  { title: 'Calendar', icon: CalendarDays },
  { title: 'Library', icon: BookOpen, children: ['Documents', 'Templates'] },
  { title: 'Reports', icon: ChartColumn },
  { title: 'Settings', icon: Settings },
]

function ExampleSideNav({ initialActive = 'Overview', ...props }: Partial<SideNavProps> & { initialActive?: string }) {
  const [active, setActive] = useState(initialActive)

  function select(title: string) {
    return (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      setActive(title)
    }
  }

  return (
    <SideNav {...props}>
      <SideNavBody>
        {NAV_ITEMS.map((item) =>
          item.children ? (
            <SideNavLink key={item.title} title={item.title} icon={item.icon}>
              <SideNavLevel>
                {item.children.map((child) => (
                  <SideNavLink key={child} title={child} href="#" isActive={active === child} onClick={select(child)} />
                ))}
              </SideNavLevel>
            </SideNavLink>
          ) : (
            <SideNavLink
              key={item.title}
              title={item.title}
              icon={item.icon}
              href="#"
              isActive={active === item.title}
              onClick={select(item.title)}
            />
          ),
        )}
      </SideNavBody>
    </SideNav>
  )
}

/** Figma's sidebar frames are 698px tall (a 750px screen under the 50px TopNav). */
function Frame({ children }: { children: ReactNode }) {
  return <div className="flex h-[698px] bg-background">{children}</div>
}

const meta: Meta<typeof SideNav> = {
  title: 'Components/SideNav',
  component: SideNav,
  tags: ['ai-generated', 'autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof SideNav>

/** The expanded 200px nav. Library is a group whose sub-items expand inline. */
export const Default: Story = {
  render: () => (
    <Frame>
      <ExampleSideNav />
    </Frame>
  ),
  play: async ({ canvas, userEvent }) => {
    const overview = canvas.getByRole('link', { name: 'Overview' })
    await expect(overview).toHaveAttribute('aria-current', 'page')
    await expect(canvas.getByRole('navigation', { name: 'Main' }).getBoundingClientRect().width).toBe(200)

    const library = canvas.getByRole('button', { name: 'Library' })
    await expect(library).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(library)
    await expect(library).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(canvas.getByRole('link', { name: 'Documents' }))
    await expect(canvas.getByRole('link', { name: 'Documents' })).toHaveAttribute('aria-current', 'page')
    await expect(overview).not.toHaveAttribute('aria-current')
  },
}

/** A group opens by itself when one of its sub-items is the current page. */
export const ActiveSubItem: Story = {
  render: () => (
    <Frame>
      <ExampleSideNav initialActive="Documents" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('link', { name: 'Documents' })).toHaveAttribute('aria-current', 'page')
  },
}

/** The 56px icon rail. Hovering or clicking a group opens its sub-items in a flyout. */
export const Collapsed: Story = {
  render: () => (
    <Frame>
      <ExampleSideNav defaultIsExpanded={false} initialActive="Documents" />
    </Frame>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('navigation', { name: 'Main' }).getBoundingClientRect().width).toBe(56)
    // Labels are visually hidden but still name each link.
    await expect(canvas.getByRole('link', { name: 'Projects' })).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: 'Library' }))
    const body = within(document.body)
    const documents = await body.findByRole('link', { name: 'Documents' })
    await expect(documents).toHaveAttribute('aria-current', 'page')

    // Choosing a sub-item closes the flyout.
    await userEvent.click(body.getByRole('link', { name: 'Templates' }))
    await waitFor(() => expect(body.queryByRole('link', { name: 'Templates' })).not.toBeInTheDocument())
  },
}

/** The button at the bottom switches between the full nav and the rail. */
export const CollapseToggle: Story = {
  render: () => (
    <Frame>
      <ExampleSideNav initialActive="Projects" />
    </Frame>
  ),
  play: async ({ canvas, userEvent }) => {
    const nav = canvas.getByRole('navigation', { name: 'Main' })
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse sidebar' }))
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(56))
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }))
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(200))
  },
}

/** TopNav and SideNav together in a full app layout. */
export const WithTopNav: Story = {
  render: () => (
    <div className="flex h-[750px] flex-col bg-background">
      <ExampleTopNav />
      <div className="flex min-h-0 flex-1">
        <ExampleSideNav initialActive="Projects" />
        <main className="min-w-0 flex-1 px-[var(--space-24)] py-[var(--space-24)]">
          <h1 className="m-0 font-[family-name:var(--font-family-primary)] text-[length:var(--text-h5-size)] leading-[var(--text-h5-line-height)] tracking-[var(--text-h5-letter-spacing)] font-normal text-foreground">
            Projects
          </h1>
        </main>
      </div>
    </div>
  ),
}
