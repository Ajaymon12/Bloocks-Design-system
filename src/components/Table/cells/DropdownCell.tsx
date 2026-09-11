import type { ChangeEvent } from 'react'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { ChevronDown } from 'lucide-react'
import type { SelectOption } from '@/components/Input/Select'

export type DropdownCellProps = {
  accessibilityLabel: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

// A native <select> filling the entire cell — not a wrapped Select (which carries its own
// visible border/shadow/rounded box), because that reads as a form field floating *inside* the
// cell rather than the cell itself being the field. Pair with `meta: { fillCell: true }` on the
// column def so the wrapping <td> contributes no padding of its own; this component's own
// px/py reproduce the standard cell padding so text still lines up with plain-text cells in the
// same row, while the full-bleed w-full/h-full keeps the entire cell clickable, not just an
// inset box.
export function DropdownCell({ accessibilityLabel, options, placeholder, ...props }: DropdownCellProps) {
  return (
    <div className="relative w-full h-full">
      <select
        aria-label={accessibilityLabel}
        className="w-full h-full appearance-none bg-transparent border-0 outline-none cursor-pointer px-[var(--space-12)] py-[var(--space-8)] pr-[var(--space-24)] text-inherit font-[family-name:var(--font-family-primary)]"
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-[var(--space-8)] top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
