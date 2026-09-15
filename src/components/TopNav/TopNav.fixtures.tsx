import { useState } from 'react'
import { Bell, Check, CircleHelp, Hexagon, LogOut, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TopNav,
  TopNavActions,
  TopNavAvatar,
  TopNavBrand,
  TopNavButton,
  TopNavDivider,
  TopNavOrgAvatar,
  TopNavOrgSwitcher,
} from './TopNav'

// A fully composed top bar with generic placeholder content, shared by the TopNav and SideNav
// stories. Names, labels and icons are deliberately generic, not taken from any product.

const WORKSPACES = [
  { id: 'acme', name: 'Acme Corporation International', color: '#12a594' },
  { id: 'globex', name: 'Globex Industries', color: '#465ed5' },
  { id: 'initech', name: 'Initech', color: '#d48c00' },
]

const USER = { name: 'Jane Doe', email: 'jane.doe@example.com' }

/** A neutral stand-in for a product logo. */
export function PlaceholderLogo() {
  return (
    <span className="inline-flex items-center gap-[var(--space-8)] p-[2px] font-[family-name:var(--font-family-primary)] text-[length:var(--text-label-1-size)] leading-[var(--text-label-1-line-height)] font-medium text-[var(--color-topnav-text)]">
      <Hexagon size={22} />
      Brand
    </span>
  )
}

export function ExampleTopNav({ onHelpClick }: { onHelpClick?: () => void } = {}) {
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id)
  const workspace = WORKSPACES.find((candidate) => candidate.id === workspaceId) ?? WORKSPACES[0]

  return (
    <TopNav>
      <TopNavBrand href="#" accessibilityLabel="Home">
        <PlaceholderLogo />
      </TopNavBrand>
      <TopNavActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TopNavOrgSwitcher name={workspace.name} avatarColor={workspace.color} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px]">
            {WORKSPACES.map((candidate) => (
              <DropdownMenuItem key={candidate.id} onSelect={() => setWorkspaceId(candidate.id)}>
                <TopNavOrgAvatar name={candidate.name} color={candidate.color} />
                <span className="min-w-0 flex-1 truncate">{candidate.name}</span>
                {candidate.id === workspaceId && <Check size={14} className="shrink-0 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TopNavDivider />
        <TopNavButton icon={<CircleHelp />} onClick={onHelpClick}>
          Help
        </TopNavButton>
        <TopNavButton icon={<Bell />} accessibilityLabel="Notifications" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TopNavAvatar name={USER.name} accessibilityLabel="Profile menu" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            <div className="flex flex-col px-[var(--space-8)] py-[var(--space-8)]">
              <span className="text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] font-medium text-foreground">
                {USER.name}
              </span>
              <span className="truncate text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] text-muted-foreground">
                {USER.email}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={16} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings size={16} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut size={16} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TopNavActions>
    </TopNav>
  )
}
