import { Children, createContext, isValidElement, useContext, useId, useRef, useState } from 'react'
import type { ComponentType, ElementType, MouseEvent, ReactElement, ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Figma: Top and sidebar → SideBar (node 21786:46818), SideBar - Mini
// (21786:53962), Sub Sidebar components (21786:53507), Sidebar mini - sub components (21786:54090)
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=21786-46818
// API modelled on Blade's SideNav — SideNav / SideNavBody / SideNavSection / SideNavLink /
// SideNavLevel / SideNavFooter: https://blade.razorpay.com/?path=/docs/components-sidenav--docs
//
// Deliberate departures from Blade, following Figma: sub-items expand inline under their parent
// (Blade slides in a second panel), and the collapsed 56px rail stays collapsed on hover. A group
// in the rail opens its sub-items in a flyout card instead. Active state is the caller's to manage,
// as in Blade: set `isActive` on the link that matches the current route.

export type SideNavIconComponent = ComponentType<{ size?: number; className?: string }>

type SideNavContextValue = { isExpanded: boolean }

const SideNavContext = createContext<SideNavContextValue>({ isExpanded: true })
/** 1 for top-level links, 2 for links inside a SideNavLevel. */
const LevelContext = createContext<1 | 2>(1)
/** Set inside a collapsed group's flyout, so choosing a sub-item closes it. */
const CloseFlyoutContext = createContext<(() => void) | null>(null)

const labelClasses =
  'font-[family-name:var(--font-family-primary)] text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)] font-normal'

const itemClasses = cn(
  'relative flex shrink-0 cursor-pointer items-center gap-[var(--space-8)] rounded-[var(--radius-6)] border-0 bg-transparent p-[var(--space-8)]',
  'text-left no-underline text-[var(--color-text-secondary)] transition-[background-color,color] duration-150 ease-in-out',
  'hover:bg-[var(--color-primary-subtle)]',
  labelClasses,
)
const tintedItemClasses = 'bg-[var(--color-primary-subtle)] text-foreground'

export type SideNavProps = {
  /** SideNavBody, and optionally SideNavFooter. */
  children: ReactNode
  /** Controlled width: `true` for the 200px nav, `false` for the 56px icon rail. */
  isExpanded?: boolean
  /** Starting width when uncontrolled. Defaults to expanded. */
  defaultIsExpanded?: boolean
  /** Called when the collapse button is pressed. */
  onExpandChange?: (args: { isExpanded: boolean }) => void
  /** Hides the collapse button at the bottom. */
  hideCollapseButton?: boolean
  /** Name of the navigation landmark. */
  accessibilityLabel?: string
  className?: string
}

export function SideNav({
  children,
  isExpanded: controlledIsExpanded,
  defaultIsExpanded = true,
  onExpandChange,
  hideCollapseButton = false,
  accessibilityLabel = 'Main',
  className,
}: SideNavProps) {
  const [uncontrolledIsExpanded, setUncontrolledIsExpanded] = useState(defaultIsExpanded)
  const isExpanded = controlledIsExpanded ?? uncontrolledIsExpanded
  const navId = useId()

  function toggle() {
    const next = !isExpanded
    if (controlledIsExpanded === undefined) setUncontrolledIsExpanded(next)
    onExpandChange?.({ isExpanded: next })
  }

  return (
    <SideNavContext.Provider value={{ isExpanded }}>
      <nav
        id={navId}
        aria-label={accessibilityLabel}
        className={cn(
          'relative flex h-full shrink-0 flex-col border-r border-solid border-[var(--color-border-subtle)] bg-[var(--color-surface)]',
          'px-[var(--space-12)] pt-[var(--space-16)] font-[family-name:var(--font-family-primary)]',
          'transition-[width] duration-200 ease-in-out motion-reduce:transition-none',
          isExpanded ? 'w-[200px]' : 'w-[56px]',
          // Leaves room for the collapse button, which sits over the bottom edge.
          hideCollapseButton ? 'pb-[var(--space-8)]' : 'pb-[40px]',
          className,
        )}
      >
        {children}
        {!hideCollapseButton && (
          <button
            type="button"
            aria-controls={navId}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={toggle}
            className={cn(
              // right: -1px lays the button over the nav's own right border, as in Figma.
              'absolute bottom-0 right-[-1px] flex cursor-pointer items-center justify-center border-0 p-[var(--space-8)]',
              'bg-[var(--color-primary-subtle)] text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-foreground',
              isExpanded ? 'w-[41px] rounded-tl-[var(--radius-6)]' : 'w-[calc(100%+1px)]',
            )}
          >
            {isExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        )}
      </nav>
    </SideNavContext.Provider>
  )
}

// The negative margin and matching padding give the global 2px focus ring (2px offset) room
// inside the scroll container, which would otherwise clip it at the edges.
const listClasses =
  'm-0 flex list-none flex-col gap-[var(--space-4)] p-[var(--space-4)] -mx-[var(--space-4)] -mt-[var(--space-4)]'

/** The scrolling list of links. */
export function SideNavBody({ children }: { children: ReactNode }) {
  return <ul className={cn(listClasses, 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden')}>{children}</ul>
}

/** Links pinned below the body, e.g. Help or Settings. */
export function SideNavFooter({ children }: { children: ReactNode }) {
  return (
    <ul className={cn(listClasses, 'mt-[var(--space-8)] border-t border-solid border-[var(--color-border-subtle)] pt-[var(--space-12)]')}>
      {children}
    </ul>
  )
}

export type SideNavSectionProps = {
  /** Heading shown above the section's links. In the collapsed rail it becomes a divider. */
  title?: string
  children: ReactNode
}

/** Groups related links under an optional heading. */
export function SideNavSection({ title, children }: SideNavSectionProps) {
  const { isExpanded } = useContext(SideNavContext)
  return (
    <li className="flex flex-col gap-[var(--space-4)] [&+&]:mt-[var(--space-8)]">
      {title &&
        (isExpanded ? (
          <span className="truncate px-[var(--space-8)] pb-[var(--space-4)] pt-[var(--space-8)] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] tracking-[var(--text-label-3-letter-spacing)] text-[var(--color-text-secondary)]">
            {title}
          </span>
        ) : (
          <span aria-hidden="true" className="mx-[var(--space-8)] my-[var(--space-4)] h-px bg-[var(--color-border-subtle)]" />
        ))}
      <ul aria-label={title} className="m-0 flex list-none flex-col gap-[var(--space-4)] p-0">
        {children}
      </ul>
    </li>
  )
}

/** Wraps a parent link's sub-items: `<SideNavLink title="Library"><SideNavLevel>…</SideNavLevel></SideNavLink>`. */
export function SideNavLevel({ children }: { children: ReactNode }) {
  return (
    <LevelContext.Provider value={2}>
      <ul className="m-0 flex list-none flex-col p-0 pt-[2px]">{children}</ul>
    </LevelContext.Provider>
  )
}

export type SideNavLinkProps = {
  title: string
  /** A lucide icon component, e.g. `icon={LayoutGrid}`. Shown on top-level links only. */
  icon?: SideNavIconComponent
  href?: string
  target?: string
  /**
   * Renders the link as another component, e.g. a router link that maps `href` to its own prop:
   * `as={({ href, ...props }) => <Link to={href} {...props} />}`.
   */
  as?: ElementType
  /** Marks the link for the current page. The caller decides which one that is. */
  isActive?: boolean
  /** Rendered after the title, e.g. a Badge. Hidden in the collapsed rail. */
  titleSuffix?: ReactElement
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** A SideNavLevel of sub-items. Turns this link into an expandable group. */
  children?: ReactElement
}

export function SideNavLink(props: SideNavLinkProps) {
  const level = useContext(LevelContext)
  if (level === 2) return <SubLink {...props} />
  if (props.children) return <GroupLink {...props} />
  return <TopLink {...props} />
}

function hasActiveDescendant(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) =>
      isValidElement<{ isActive?: boolean; children?: ReactNode }>(child) &&
      (Boolean(child.props.isActive) || hasActiveDescendant(child.props.children)),
  )
}

function TopLink({ title, icon: Icon, href, target, as, isActive = false, titleSuffix, onClick }: SideNavLinkProps) {
  const { isExpanded } = useContext(SideNavContext)
  const Component: ElementType = as ?? (href ? 'a' : 'button')
  return (
    <li className="flex">
      <Component
        href={href}
        target={target}
        type={Component === 'button' ? 'button' : undefined}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        title={isExpanded ? undefined : title}
        className={cn(
          itemClasses,
          isExpanded ? 'h-[36px] w-full' : 'size-[32px] justify-center',
          isActive && tintedItemClasses,
        )}
      >
        {Icon && <Icon size={16} className={cn('shrink-0', isActive && 'text-primary')} />}
        <span className={isExpanded ? 'min-w-0 truncate' : 'sr-only'}>{title}</span>
        {isExpanded && titleSuffix}
      </Component>
    </li>
  )
}

function GroupLink({ title, icon: Icon, titleSuffix, children }: SideNavLinkProps) {
  const { isExpanded } = useContext(SideNavContext)
  const hasActiveChild = hasActiveDescendant(children)
  const [isOpen, setIsOpen] = useState(hasActiveChild)
  const [previousHasActiveChild, setPreviousHasActiveChild] = useState(hasActiveChild)
  const levelId = useId()

  // When a sub-item becomes active (e.g. after navigating elsewhere), open its group.
  if (hasActiveChild !== previousHasActiveChild) {
    setPreviousHasActiveChild(hasActiveChild)
    if (hasActiveChild) setIsOpen(true)
  }

  if (!isExpanded) {
    return (
      <CollapsedGroup title={title} icon={Icon} hasActiveChild={hasActiveChild}>
        {children}
      </CollapsedGroup>
    )
  }

  const isTinted = isOpen || hasActiveChild
  return (
    <li className="flex flex-col">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={levelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(itemClasses, 'h-[36px] w-full', isTinted && tintedItemClasses)}
      >
        {Icon && <Icon size={16} className={cn('shrink-0', isTinted && 'text-primary')} />}
        <span className="min-w-0 truncate">{title}</span>
        {titleSuffix}
        {isOpen ? (
          <ChevronDown size={16} className="ml-auto shrink-0" />
        ) : (
          <ChevronRight size={16} className="ml-auto shrink-0" />
        )}
      </button>
      {isOpen && <div id={levelId}>{children}</div>}
    </li>
  )
}

const FLYOUT_CLOSE_DELAY = 150

function CollapsedGroup({
  title,
  icon: Icon,
  hasActiveChild,
  children,
}: {
  title: string
  icon?: SideNavIconComponent
  hasActiveChild: boolean
  children?: ReactElement
}) {
  const [isOpen, setIsOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  // Hover shouldn't pull focus into the flyout; a click or key press should.
  const openedByHover = useRef(false)

  function openOnHover() {
    window.clearTimeout(closeTimer.current)
    if (!isOpen) {
      openedByHover.current = true
      setIsOpen(true)
    }
  }

  function closeAfterDelay() {
    // A flyout opened by click or keyboard stays open until Escape, an outside click, or a choice.
    if (!openedByHover.current) return
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setIsOpen(false), FLYOUT_CLOSE_DELAY)
  }

  function close() {
    window.clearTimeout(closeTimer.current)
    setIsOpen(false)
  }

  const isTinted = isOpen || hasActiveChild
  return (
    <li className="flex" onPointerEnter={openOnHover} onPointerLeave={closeAfterDelay}>
      <Popover open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
        <PopoverAnchor asChild>
          <button
            ref={anchorRef}
            type="button"
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={() => {
              window.clearTimeout(closeTimer.current)
              // A click on a hover-opened flyout pins it open; a click on a pinned one closes it.
              if (isOpen && !openedByHover.current) {
                setIsOpen(false)
              } else {
                openedByHover.current = false
                setIsOpen(true)
              }
            }}
            className={cn(
              itemClasses,
              'size-[32px] justify-center overflow-hidden rounded-br-none',
              isTinted && tintedItemClasses,
            )}
          >
            {Icon && <Icon size={16} className={cn('shrink-0', isTinted && 'text-primary')} />}
            <span className="sr-only">{title}</span>
            {/* Corner marker: this item has sub-items. */}
            <span
              aria-hidden="true"
              className="absolute bottom-0 right-0 size-[8px] bg-[var(--color-sidenav-group-indicator)] [clip-path:polygon(100%_0,100%_100%,0_100%)]"
            />
          </button>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={6}
          onPointerEnter={openOnHover}
          onPointerLeave={closeAfterDelay}
          onOpenAutoFocus={(event) => {
            if (openedByHover.current) event.preventDefault()
          }}
          // The anchor is a plain button, not a PopoverTrigger, so Radix would count pressing it as
          // an outside interaction and dismiss, racing its own click handler. PopoverTrigger
          // suppresses this internally; do the same here.
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
          className="min-w-[177px] rounded-[var(--radius-6)] border-[color:var(--color-border-subtle)] px-[10px] py-[var(--space-12)]"
        >
          <span className="block truncate px-[7px] pb-[var(--space-4)] text-foreground">
            <span className={labelClasses}>{title}</span>
          </span>
          <CloseFlyoutContext.Provider value={close}>{children}</CloseFlyoutContext.Provider>
        </PopoverContent>
      </Popover>
    </li>
  )
}

function SubLink({ title, href, target, as, isActive = false, titleSuffix, onClick }: SideNavLinkProps) {
  const closeFlyout = useContext(CloseFlyoutContext)
  const Component: ElementType = as ?? (href ? 'a' : 'button')
  return (
    <li className="flex">
      <Component
        href={href}
        target={target}
        type={Component === 'button' ? 'button' : undefined}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => {
          onClick?.(event)
          closeFlyout?.()
        }}
        className={cn(
          'group/sub flex h-[34px] w-full min-w-0 cursor-pointer items-center gap-[6px] rounded-[var(--radius-4)] border-0 bg-transparent pl-[2px] pr-[var(--space-4)]',
          'text-left no-underline whitespace-nowrap',
          labelClasses,
          isActive ? 'text-primary' : 'text-[var(--color-text-secondary)]',
        )}
      >
        <span aria-hidden="true" className="relative h-full w-[24px] shrink-0">
          <span className="absolute inset-y-0 left-[11px] w-[2px] bg-[var(--color-sidenav-rail)]" />
          <span
            className={cn(
              'absolute left-[11px] top-1/2 h-[18px] w-[2px] -translate-y-1/2 transition-colors duration-150',
              isActive ? 'bg-primary' : 'bg-transparent group-hover/sub:bg-[var(--color-text-secondary)]',
            )}
          />
        </span>
        <span className="min-w-0 truncate">{title}</span>
        {titleSuffix}
      </Component>
    </li>
  )
}
