import type { ComponentProps } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PanelSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Spread onto the <input>, so a combobox can own its ARIA wiring (role, aria-controls, …). */
  inputProps?: ComponentProps<'input'>
  className?: string
}

/** The search row shared by the floating panels (Combobox, FilterDropdown). */
export function PanelSearch({ value, onChange, placeholder = 'Search…', inputProps, className }: PanelSearchProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[var(--space-8)] border-b border-[var(--color-table-border)]',
        // The field has no outline of its own (below), so the row's divider carries the focus cue.
        'transition-colors duration-150 focus-within:border-b-[var(--color-primary)]',
        'px-[var(--space-12)] py-[var(--space-10)]',
        className,
      )}
    >
      {/* No ring on the input itself — the row's bottom border turns primary while it has focus,
          which reads as "you're typing here" without a box inside the panel. */}
      <Search size={14} className="shrink-0 text-muted-foreground" />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        // Inline style, not `focus-visible:outline-none`: the global :focus-visible rule in
        // tokens.css is unlayered, so it beats any Tailwind utility (those live in @layer
        // utilities). The panel itself is the focus container here.
        style={{ outline: 'none' }}
        className="w-full min-w-0 border-0 bg-transparent text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] text-foreground placeholder:text-muted-foreground"
        {...inputProps}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
