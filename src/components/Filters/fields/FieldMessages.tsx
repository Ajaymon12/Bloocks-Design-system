import type { ReactNode } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { CircleAlert, Loader2, SearchX } from 'lucide-react'
import { Button } from '@/components/Button/Button'

// The empty, loading and error states shared by every field body — same markup as FilterDropdown's
// "No matches" block, so a filter looks the same whichever surface opened it.

const MESSAGE_TEXT = 'm-0 text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-muted-foreground'

export function FieldMessage({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center text-muted-foreground">
      {icon}
      <p className={MESSAGE_TEXT}>{children}</p>
    </div>
  )
}

export function NoMatches({ query }: { query: string }) {
  return <FieldMessage icon={<SearchX size={20} aria-hidden="true" />}>No matches for “{query}”</FieldMessage>
}

export function LoadingMessage() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-muted-foreground"
    >
      <Loader2 size={16} aria-hidden="true" className="animate-[spin_0.6s_linear_infinite]" />
      Loading…
    </div>
  )
}

export function ErrorMessage({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-8)] px-[var(--space-12)] py-[var(--space-24)] text-center">
      <CircleAlert size={20} aria-hidden="true" className="text-destructive" />
      <p className={MESSAGE_TEXT}>{children}</p>
      <Button variant="link" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 px-[var(--space-8)] pb-[var(--space-4)] pt-[var(--space-8)] text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
      {children}
    </p>
  )
}
