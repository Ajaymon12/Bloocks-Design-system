import type { ReactNode } from 'react'
import { useState } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown, ChevronLeft, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type BreadcrumbProps = {
  /** Full trail in order, first item is the root (e.g. "Home"). */
  items: BreadcrumbItem[]
  /** Called when the back (chevron-left) button is clicked. Omit to hide the button. */
  onBack?: () => void
  /** Called when a non-current crumb is clicked, instead of following `href`. */
  onNavigate?: (item: BreadcrumbItem, index: number) => void
  /** Collapse the trail behind an ellipsis once it exceeds this many trailing items. */
  maxVisible?: number
  /** Sibling pages shown in a dropdown next to the current page (compact 2-item trails). */
  siblings?: BreadcrumbItem[]
  /** Separator rendered between crumbs. Defaults to "/". */
  separator?: ReactNode
}

const crumbLinkClasses =
  'font-[family-name:var(--font-family-primary)] text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)] tracking-[var(--text-body-2-letter-spacing)] font-normal text-muted-foreground no-underline whitespace-nowrap bg-none border-0 p-0 cursor-pointer hover:text-foreground hover:underline'

function Separator({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center font-[family-name:var(--font-family-primary)] text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)] text-muted-foreground"
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

function Crumb({
  item,
  index,
  onNavigate,
}: {
  item: BreadcrumbItem
  index: number
  onNavigate?: (item: BreadcrumbItem, index: number) => void
}) {
  if (!item.href && !onNavigate) {
    return <span className={crumbLinkClasses}>{item.label}</span>
  }
  return (
    <a
      className={crumbLinkClasses}
      href={item.href ?? '#'}
      onClick={
        onNavigate
          ? (event) => {
              event.preventDefault()
              onNavigate(item, index)
            }
          : undefined
      }
    >
      {item.label}
    </a>
  )
}

export function Breadcrumb({
  items,
  onBack,
  onNavigate,
  maxVisible = 4,
  siblings,
  separator = '/',
}: BreadcrumbProps) {
  const [siblingsOpen, setSiblingsOpen] = useState(false)

  if (items.length <= 1) {
    return (
      <h2 className="m-0 font-[family-name:var(--font-family-primary)] text-[length:var(--text-h6-size)] leading-[var(--text-h6-line-height)] tracking-[var(--text-h6-letter-spacing)] font-medium text-foreground">
        {items[0]?.label}
      </h2>
    )
  }

  const home = items[0]
  const current = items[items.length - 1]
  const collapse = items.length > maxVisible
  const tail = collapse ? items.slice(-(maxVisible - 1), -1) : items.slice(1, -1)

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-[var(--space-8)] gap-y-[var(--space-4)] m-0 p-0 list-none">
        {onBack && (
          <li className="flex items-center gap-[var(--space-8)]">
            <button
              type="button"
              className="inline-flex items-center justify-center p-[var(--space-4)] border-0 rounded-[var(--radius-4)] bg-accent text-muted-foreground cursor-pointer leading-none hover:text-foreground"
              onClick={onBack}
              aria-label="Back"
            >
              <ChevronLeft size={16} />
            </button>
          </li>
        )}

        <li className="flex items-center gap-[var(--space-8)]">
          <Crumb item={home} index={0} onNavigate={onNavigate} />
        </li>

        <Separator>{separator}</Separator>

        {collapse && (
          <>
            <li className="flex items-center gap-[var(--space-8)]">
              <button
                type="button"
                className="inline-flex items-center justify-center p-[var(--space-4)] border-0 bg-transparent text-muted-foreground cursor-pointer leading-none hover:text-foreground"
                aria-label="Show hidden crumbs"
              >
                <MoreHorizontal size={16} />
              </button>
            </li>
            <Separator>{separator}</Separator>
          </>
        )}

        {tail.map((item) => {
          const index = items.indexOf(item)
          return (
            <li key={item.href ?? `${item.label}-${index}`} className="flex items-center gap-[var(--space-8)]">
              <Crumb item={item} index={index} onNavigate={onNavigate} />
              <Separator>{separator}</Separator>
            </li>
          )
        })}

        <li className="flex items-center gap-[var(--space-8)]">
          <div
            className={cn(
              'relative flex items-center gap-[var(--space-4)]',
              siblings &&
                siblings.length > 0 &&
                'rounded-[var(--radius-6)] transition-[background-color,color] duration-150 ease-in-out hover:bg-accent hover:pl-[var(--space-4)] [&:hover_[data-current]]:text-primary',
            )}
          >
            <span
              data-current
              className="font-[family-name:var(--font-family-primary)] text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)] tracking-[var(--text-body-2-letter-spacing)] font-normal text-foreground whitespace-nowrap"
              aria-current="page"
            >
              {current.label}
            </span>
            {siblings && siblings.length > 0 && (
              <>
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-[var(--space-4)] border-0 rounded-[var(--radius-4)] bg-accent text-muted-foreground cursor-pointer leading-none hover:text-foreground"
                  aria-label="Show sibling pages"
                  aria-expanded={siblingsOpen}
                  onClick={() => setSiblingsOpen((open) => !open)}
                >
                  <ChevronDown size={12} />
                </button>
                {siblingsOpen && (
                  <ul className="absolute top-[calc(100%+var(--space-4))] left-0 z-10 flex flex-col min-w-[160px] p-[var(--space-4)] m-0 list-none bg-popover border border-border rounded-[var(--radius-8)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                    {siblings.map((sibling, index) => (
                      <li key={sibling.href ?? `${sibling.label}-${index}`}>
                        <a
                          className="block font-[family-name:var(--font-family-primary)] text-[length:var(--text-body-2-size)] leading-[var(--text-body-2-line-height)] text-popover-foreground no-underline bg-none border-0 text-left p-[var(--space-8)] rounded-[var(--radius-4)] cursor-pointer hover:bg-muted"
                          href={sibling.href ?? '#'}
                          onClick={
                            onNavigate
                              ? (event) => {
                                  event.preventDefault()
                                  setSiblingsOpen(false)
                                  onNavigate(sibling, index)
                                }
                              : undefined
                          }
                        >
                          {sibling.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </li>
      </ol>
    </nav>
  )
}
